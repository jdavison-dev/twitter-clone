import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { Link } from "react-router-dom"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';

import { formatPostDate } from '../../utils/date/index'

const CreatePost = ({ initialQuotedPost, onCloseModal }) => {
	// Local state for the post's text and image (as base64 string)	
	const [text, setText] = useState("");
	const [img, setImg] = useState(null);

	// Ref to hidden file input for image upload
	const imgRef = useRef(null);

	// Fetch authenticated user data from cache or server
	const { data:authUser } = useQuery({ queryKey: ["authUser"] });

	// React Query client to invalidate queries on success
	const queryClient = useQueryClient();

	// Mutation hook for creating a post with text and optional image
	const { mutate: sendNewPost, isPending, isError, error } = useMutation({
		mutationFn: async ({text, img, quotedPostId }) => {
			try {
				// POST request to create a post
				const res = await fetch("api/posts/create", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({ text, img, quotedPostId }),
				})
				const data = await res.json();

				// Throw error if server responds with error
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},

		// On successful post creation:
		// - Clear text and image inputs
		// - Show success toast notification
		// - Invalidate 'posts' query to refresh posts list
		onSuccess: () => {
			setText("");
			setImg(null);
			toast.success("Post created successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			// Close modal 
			if (onCloseModal) {
				onCloseModal();
			}
		}
	});

	// Handle form submission to create post
	const handleSubmit = (e) => {
		e.preventDefault();
		const quotedPostId = initialQuotedPost ? initialQuotedPost._id : null;

  	  sendNewPost({ text, img, quotedPostId });
	};

	// Handle image file input change and convert to base64 string for preview/upload
	const handleImgChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				setImg(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const submitButtonText = isPending ? "Posting..." : (initialQuotedPost ? "Post Quote" : "Post");

    return (
        <div className='flex p-4 items-start gap-4 border-b border-gray-700'>
            {/* User avatar */}
            <div className='avatar'>
                <div className='w-8 rounded-full'>
                    <img src={authUser?.profileImg || "/avatar-placeholder.png"} alt="User avatar" />
                </div>
            </div>

            {/* Form for creating a post */}
            <form className='flex flex-col gap-2 w-full' onSubmit={handleSubmit}>
                {/* Textarea for post content */}
                <textarea
                    className='textarea w-full p-0 text-lg resize-none border-none focus:outline-none border-gray-800'
                    placeholder={initialQuotedPost ? "Add your comment to this post (optional)..." : "What is happening?!"}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                {/* Show image preview with close button if image is selected */}
                {img && (
                    <div className='relative w-72 mx-auto'>
                        {/* Close icon to remove selected image */}
                        <IoCloseSharp
                            className='absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
                            onClick={() => {
                                setImg(null);
                                if (imgRef.current) { // Check if ref exists before accessing value
                                    imgRef.current.value = null;
                                }
                            }}
                        />
                        {/* Image preview */}
                        <img src={img} className='w-full mx-auto h-72 object-contain rounded' alt="Image preview" />
                    </div>
                )}

                {/* Conditional Rendering for Quoted Post Preview */}
                {initialQuotedPost && (
                    <div className='border border-gray-700 rounded-lg p-3 mt-3'>
                        {/* User info of the ORIGINAL quoted post */}
                        <div className='flex gap-2 items-center'>
                            <Link to={`/profile/${initialQuotedPost.user.username}`}>
                                <div className='w-6 h-6 rounded-full overflow-hidden'>
                                    <img src={initialQuotedPost.user.profileImg || "/avatar-placeholder.png"} alt={`${initialQuotedPost.user.username}'s avatar`} />
                                </div>
                            </Link>
                            <Link to={`/profile/${initialQuotedPost.user.username}`} className='font-bold text-sm'>
                                {initialQuotedPost.user.fullName}
                            </Link>
                            <span className='text-gray-500 text-xs'>
                                <Link to={`/profile/${initialQuotedPost.user.username}`}>@{initialQuotedPost.user.username} </Link>
                                <span>·</span>
                                <span> {formatPostDate(initialQuotedPost.createdAt)}</span>
                            </span>
                        </div>
                        {/* Text of the ORIGINAL quoted post */}
                        <p className='text-sm mt-1'>{initialQuotedPost.text}</p>
                        {/* Image of the ORIGINAL quoted post (if any) */}
                        {initialQuotedPost.img && (
                            <img
                                src={initialQuotedPost.img}
                                className='h-40 object-contain rounded-lg border border-gray-700 mt-2'
                                alt='Quoted post image'
                            />
                        )}
                    </div>
                )}
                {/* END OF QUOTED POST PREVIEW */}

                {/* Footer controls: image upload icon, emoji icon, and submit button */}
                <div className='flex justify-between border-t py-2 border-t-gray-700'>
                    <div className='flex gap-1 items-center'>
                        {/* Image icon triggers hidden file input click */}
                        <CiImageOn
                            className='fill-primary w-6 h-6 cursor-pointer'
                            onClick={() => imgRef.current.click()}
                        />
                        {/* Emoji icon (currently just visual) */}
                        <BsEmojiSmileFill className='fill-primary w-5 h-5 cursor-pointer' />
                    </div>

                    {/* Hidden file input for selecting image */}
                    <input type='file' accept='image/*' hidden ref={imgRef} onChange={handleImgChange} />

                    {/* Submit button with loading state */}
                    <button className='btn btn-primary rounded-full btn-sm text-white px-4' type='submit' disabled={isPending}>
                        {submitButtonText}
                    </button>
                </div>

                {/* Show error message if posting fails */}
                {isError && <div className='text-red-500'>{error.message}</div>}
            </form>
        </div>
    );
};

export default CreatePost;