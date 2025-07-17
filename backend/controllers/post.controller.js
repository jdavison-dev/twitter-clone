import Notification from '../models/notification.model.js';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import { v2 as cloudinary } from 'cloudinary';

// Create a new post with optional text and image
export const createPost = async (req, res) => {    
	try {
		const { text, quotedPostId } = req.body;
		let { img } = req.body;
		const userId = req.user._id.toString();

		// Find the user making the post
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		// Require at least text or image in the post
		if (!text && !img && !quotedPostId) {
			return res.status(400).json({ error: "Post must have text or image" });
		}

		// If there is an image string, upload it to Cloudinary
		if (img) {
			const uploadedResponse = await cloudinary.uploader.upload(img);
			img = uploadedResponse.secure_url; // Use Cloudinary URL for the image
		}

		// Create and save the new post document
		const newPost = new Post({
			user: userId,
			text,
			img,
            quotedPost: quotedPostId || null, // Set to null if not repost
		});

		await newPost.save();

        const populatedPost = await Post.findById(newPost._id)
            .populate("user", "-password")
            .populate({
                path: 'quotedPost',
                populate: {
                    path: 'user',
                    select: 'username fullName profileImg',
                }
            });

		res.status(201).json(populatedPost);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		console.log("Error in createPost controller: ", error);
	}
};

// Delete a post by ID if the current user owns it
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({error: "Post not found"});
        }

        // Check if user owns the post
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to delete this post" });
        }

        // If post has an image, remove it from Cloudinary
        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        // Delete the post from the database
        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost controller: ", error);
        res.status(500).json({ error: "Interal Server Error"});
    }
}

// Add a comment to a post
export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        // Require comment text
        if (!text) { 
            return res.status(400).json({ error: "Text field is required "});
        }
        // Find the post by ID
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Add new comment to post's comments array
        const comment = {user: userId, text};
        post.comments.push(comment);
        await post.save();

        // Re-fetch the post and populate the fields so comments display right on recache
        const updatedPost = await Post.findById(postId).populate({
            path: 'comments.user',
            select: 'username fullName profileImg'
        });
        
        res.status(200).json(updatedPost);
    } catch (error) {
        console.log("Error in commentOnPost controller: ", error);
        res.status(500).json({ error: "Internal Server Error" })
    }
}

// Toggle like/unlike on a post for the current user
export const likeUnlikePost = async(req, res) => {
    try {
        const userId = req.user._id;
        const { id: postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Check if user already liked the post
        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            // User unlikes the post: remove user from post.likes and post from user.likedPosts
            await Post.updateOne({ _id: postId}, {$pull: {likes: userId}});
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId} });

            const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
            res.status(200).json(updatedLikes);
        } else {
            // User likes the post: add user to post.likes and post to user.likedPosts
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId} });
            await post.save();

            // Create a like notification for the post owner
            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like"
            });
            await notification.save();

            const updatedLikes = post.likes;
            res.status(200).json(updatedLikes);
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// Get all posts sorted newest first, with user and comments user info populated
export const getAllPosts = async(req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate({
            path: 'user',
            select: "-password"
        })
        .populate({
            path: 'comments.user',
            select: "-password"
        })
        .populate({
            path: 'quotedPost',
            populate: {
                path: 'user',
                select: 'username fullName profileImg'
            }
        })

        if (posts.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getAllPosts controller: ", error);
        res.status(500).json({ error: "Internal Server Error" })
    }
};

// Get posts liked by a specific user
export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        if(!user) return res.status(404).json({message: "User not found"});

        // Find posts where _id is in user's likedPosts array
        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
        .populate({
            path: 'user',
            select: "-password"
        })
        .populate({
            path: 'comments.user',
            select: "-password"
        })
        .populate({ // 🌟 New: Populate quotedPost and its user 🌟
            path: 'quotedPost',
            populate: {
                path: 'user',
                select: 'username fullName profileImg'
            }
        });

        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getLikedPosts controller: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// Get posts from users that the current user is following
export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const following = user.following;

        // Find posts where user is in the following list
        const feedPosts = await Post.find({ user: { $in: following } })
        .sort({ createdAt: -1 })
        .populate({
            path: 'user',
            select: "-password"
        })
        .populate({
            path: 'comments.user',
            select: "-password"
        })
        .populate({ // 🌟 New: Populate quotedPost and its user 🌟
            path: 'quotedPost',
            populate: {
                path: 'user',
                select: 'username fullName profileImg'
            }
        });


        res.status(200).json(feedPosts);
     } catch (error) { 
        console.log("Error in getFollowingPosts controller: ", error);
        res.status(500).json({ error: "Internal Server Error" })
    }
};

// Get posts created by a specific user by username
export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Find posts by this user
        const posts = await Post.find({ user: user._id })
        .sort({ createdAt: -1 })
        .populate({
            path: 'user',
            select: "-password"
        })
        .populate({
            path: 'comments.user',
            select: "-password"
        })
        .populate({ // Populate quotedPost and its user
            path: 'quotedPost',
            populate: {
                path: 'user',
                select: 'username fullName profileImg'
            }
        });

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getUserPosts controller: ", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}