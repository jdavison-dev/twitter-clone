import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';

const CreatePost = () => {
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
	const { mutate:createPost, isPending, isError, error } = useMutation({
		mutationFn: async ({text, img}) => {
			try {
				// POST request to create a post
				const res = await fetch("api/posts/create", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({text, img}),
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
		}
	});

	// Handle form submission to create post
	const handleSubmit = (e) => {
		e.preventDefault();
		createPost({text, img});
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

	return (
		<div className='flex p-4 items-start gap-4 border-b border-gray-700'>
			{/* User avatar */}
			<div className='avatar'>
				<div className='w-8 rounded-full'>
					<img src={authUser.profileImg || "/avatar-placeholder.png"} />
				</div>
			</div>

			{/* Form for creating a post */}
			<form className='flex flex-col gap-2 w-full' onSubmit={handleSubmit}>
				{/* Textarea for post content */}
				<textarea
					className='textarea w-full p-0 text-lg resize-none border-none focus:outline-none  border-gray-800'
					placeholder='What is happening?!'
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
								imgRef.current.value = null;
							}}
						/>
						{/* Image preview */}
						<img src={img} className='w-full mx-auto h-72 object-contain rounded' />
					</div>
				)}

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
					<button className='btn btn-primary rounded-full btn-sm text-white px-4'>
						{isPending ? "Posting..." : "Post"}
					</button>
				</div>

				{/* Show error message if posting fails */}
				{isError && <div className='text-red-500'>{error.message}</div>}
			</form>
		</div>
	);
};

export default CreatePost;