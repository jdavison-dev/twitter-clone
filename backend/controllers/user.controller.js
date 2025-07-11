import bcrypt from 'bcryptjs';
import {v2 as cloudinary} from 'cloudinary';

// models
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

// Get public profile data of a user by username
export const getUserProfile = async (req, res) => {
    const { username } = req.params;

    try {
        // Find user by username, exclude password field
        const user = await User.findOne({username}).select("-password");
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getUserProfile", error.message);
        res.status(500).json({error:error.message});
    }
};

// Follow or unfollow a user by ID
export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params; // ID of user to follow/unfollow
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        // Prevent following/unfollowing self
        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: "You can't follow/unfollow yourself" });
        }

        if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

        const isFollowing = currentUser.following.includes(id);

        if(isFollowing) {
            // If already following, remove follower/following relationship
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
            // No notification sent when unfollowing
            res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // If not following, add follower/following relationship
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
            // Create a follow notification for the user being followed
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id
            });

            await newNotification.save();

            res.status(200).json({ message: "User followed successfully" });
        }
    } catch (error) {
        console.log("Error in followUnfollowUser", error.message);
        res.status(500).json({error: error.message});  
    }
}

// Get a list of suggested users to follow (excluding self and already followed)
export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get current user's following list
        const usersFollowedByMe = await User.findById(userId).select("following");

        // Get a random sample of 10 users excluding current user
        const users = await User.aggregate([
            {
                $match:{
                    _id: {$ne:userId}
                },
            },
            {$sample:{size:10}}
        ]);

        // Filter out users already followed
        const filteredUsers = users.filter(user=>!usersFollowedByMe.following.includes(user._id));
        // Take up to 4 suggested users
        const suggestedUsers = filteredUsers.slice(0, 4);

        // Remove password info before sending
        suggestedUsers.forEach((user) => (user.password = null));

        res.status(200).json(suggestedUsers)
    } catch (error) {
        console.log("Error in getSuggestedUsers: ", error.message);
        res.status(500).json({ error: error.message });  
    }
};

// Update user profile info and optionally change password, profile and cover images
export const updateUser = async (req, res) => {
    const {fullName, email, username, currentPassword, newPassword, bio, link} = req.body;
    let { profileImg, coverImg } = req.body;

    const userId = req.user._id;

    try {
        let user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found "});

        // Require both current and new password to change password
        if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({ error: "Please provide both current password and new password" });
        };

        if (currentPassword && newPassword) {
            // Verify current password is correct
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
            if (newPassword.length < 6) {
                res.status(400).json({ error: "Password must be at least 6 characters long" });
            };

            // Hash and update new password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Update profile image if provided, remove old from cloudinary
        if (profileImg) {
            if (user.profileImg){
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg =uploadedResponse.secure_url;
        }

        // Update cover image if provided, remove old from cloudinary
        if (coverImg) {
            if (user.coverImg){
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        // Update other profile fields or keep existing
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save();

        // Remove password from response for security
        user.password = null;

        return res.status(200).json(user);
    }
    catch (error) {
        console.log("Error in updateUser: ", error.message);
        res.status(500).json({ error: error.message });
    }
}