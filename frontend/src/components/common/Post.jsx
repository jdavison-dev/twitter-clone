// Icon imports
import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";

// React imports
import { useState } from "react";
import { Link } from "react-router-dom";

// React Query and toast
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Utility and components
import { formatPostDate } from "../../utils/date";
import LoadingSpinner from "./LoadingSpinner";
import CreatePost from "../../pages/home/CreatePost";

const Post = ({ post, feedType }) => {
	const [comment, setComment] = useState("");
	const [postToQuote, setPostToQuote] = useState(null); // Set when user clicks repost

	// Get current authenticated user
	const { data:authUser } = useQuery({ queryKey: ["authUser"] });

	const queryClient = useQueryClient();
	const postOwner = post.user;

	// Check if the current user has liked this post
	const isLiked = post.likes.includes(authUser._id);

	// Check if this post belongs to the current user
	const isMyPost = authUser._id === post.user._id;

	// Format the post's creation date
	const formattedDate = formatPostDate(post.createdAt);

	// Delete post mutation
	const { mutate: deletePost, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/${post._id}`, {
					method: "DELETE",
				})
				const data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			toast.success("Post deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		}
	});

	// Like post mutation
	const { mutate: likePost, isPending: isLiking } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`/api/posts/like/${post._id}`, {
					method: "POST",
				})
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: (updatedLikes) => {
			// Get all cached queries
			const cache = queryClient.getQueryCache();
			const allQueries = cache.getAll();
			
			// Find only the posts queries that have data
			const postsQueries = allQueries.filter(query => 
				query.queryKey[0] === "posts" && query.state.data
			);
			
			// Update each posts query
			postsQueries.forEach(query => {
				queryClient.setQueryData(query.queryKey, (oldData) => {
					return oldData?.map(p => 
						p._id === post._id ? { ...p, likes: updatedLikes } : p
					);
				});
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Comment mutation
	const { mutate: commentPost, isPending: isCommenting } = useMutation({
		mutationFn: async (commentText) => {
			try {
				const res = await fetch(`/api/posts/comment/${post._id}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ text: commentText }),
				})
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		// Comment system to not have to reload the page after commenting
		onSuccess: (updatedPost) => {
			// Get all cached queries
			const cache = queryClient.getQueryCache();
			const allQueries = cache.getAll();
			
			// Find only the posts queries that have data
			const postsQueries = allQueries.filter(query => 
				query.queryKey[0] === "posts" && query.state.data
			);
			
			// Update each posts query
			postsQueries.forEach(query => {
				queryClient.setQueryData(query.queryKey, (oldData) => {
					return oldData?.map(p => {
						if (p._id === updatedPost._id) {
							return updatedPost;
						}
						return p;
					})
				});
			});
			toast.success("Comment added successfully");
			setComment("");

			// Outdated, worse UX:
			// queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Handlers for UI interactions
	const handleDeletePost = () => {
		deletePost();
	};

	const handlePostComment = (e) => {
		e.preventDefault();
		if (isCommenting) return;
		commentPost(comment);
	};

	const handleLikePost = () => {
		if (isLiking) return;
		likePost();
	};

	// Sets the post to be quoted
	const handleOpenQuoteModal = () => {
		setPostToQuote(post);
		document.getElementById(`quote_post_modal${post._id}`).showModal();
	};

	const handleCloseQuoteModal = () => {
		document.getElementById(`quote_post_modal${post._id}`).close();
		setPostToQuote(null);
	};

	return (
		<>
			{/* Main post container */}
			<div className='flex gap-2 items-start p-4 border-b border-gray-700'>
				{/* Avatar */}
				<div className='avatar'>
					<Link to={`/profile/${postOwner.username}`} className='w-8 rounded-full overflow-hidden'>
						<img src={postOwner.profileImg || "/avatar-placeholder.png"} />
					</Link>
				</div>

				{/* Post content */}
				<div className='flex flex-col flex-1'>
					{/* Post header */}
					<div className='flex gap-2 items-center'>
						<Link to={`/profile/${postOwner.username}`} className='font-bold'>
							{postOwner.fullName}
						</Link>
						<span className='text-gray-700 flex gap-1 text-sm'>
							<Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
							<span>·</span>
							<span>{formattedDate}</span>
						</span>

						{/* Delete icon if it's your own post */}
						{isMyPost && (
							<span className='flex justify-end flex-1'>
								{!isDeleting && (
									<FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />
								)}
								{isDeleting && (<LoadingSpinner size='sm' />)}
							</span>
						)}
					</div>

					{/* Post text and image */}
					<div className='flex flex-col gap-3 overflow-hidden'>
						<span>{post.text}</span>
						{post.img && (
							<img
								src={post.img}
								className='h-80 object-contain rounded-lg border border-gray-700'
								alt=''
							/>
						)}
					</div>

					{/* THIS IS THE LOGIC FOR DISPLAYING THE QUOTED POST */}
					{post.quotedPost && (
						<div className='border border-gray-700 rounded-lg p-3 mt-3'>
							{/* User info of the ORIGINAL quoted post */}
							<div className='flex gap-2 items-center'>
								<Link to={`/profile/${post.quotedPost.user.username}`}>
									<div className='w-6 h-6 rounded-full overflow-hidden'>
										<img src={post.quotedPost.user.profileImg || "/avatar-placeholder.png"} alt={`${post.quotedPost.user.username}'s avatar`} />
									</div>
								</Link>
								<Link to={`/profile/${post.quotedPost.user.username}`} className='font-bold text-sm'>
									{post.quotedPost.user.fullName}
								</Link>
								<span className='text-gray-500 text-xs'>
									<Link to={`/profile/${post.quotedPost.user.username}`}>@{post.quotedPost.user.username} </Link>
									<span>·</span>
									<span> {formatPostDate(post.quotedPost.createdAt)}</span>
								</span>
							</div>
							{/* Text of the ORIGINAL quoted post */}
							<p className='text-sm mt-1'>{post.quotedPost.text}</p>
							{/* Image of the ORIGINAL quoted post (if any) */}
							{post.quotedPost.img && (
								<img
									src={post.quotedPost.img}
									className='h-40 object-contain rounded-lg border border-gray-700 mt-2'
									alt='Quoted post image'
								/>
							)}
						</div>
					)}
					{/* 👆👆👆 END OF QUOTED POST DISPLAY LOGIC  */}

					{/* Post actions: comment, repost, like, bookmark */}
					<div className='flex justify-between mt-3'>
						<div className='flex gap-4 items-center w-2/3 justify-between'>

							{/* Comment button */}
							<div
								className='flex gap-1 items-center cursor-pointer group'
								onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
							>
								<FaRegComment className='w-4 h-4  text-slate-500 group-hover:text-sky-400' />
								<span className='text-sm text-slate-500 group-hover:text-sky-400'>
									{post.comments.length}
								</span>
							</div>

							{/* Comment modal (DaisyUI) */}
							<dialog id={`comments_modal${post._id}`} className='modal border-none outline-none'>
								<div className='modal-box rounded border border-gray-600'>
									<h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
									<div className='flex flex-col gap-3 max-h-60 overflow-auto'>
										{post.comments.length === 0 && (
											<p className='text-sm text-slate-500'>
												No comments yet 🤔 Be the first one 😉
											</p>
										)}
										{/* Render comments */}

										{console.log("Comments array before mapping:", post.comments)}

										{post.comments.map((comment) => (
											<div key={comment._id} className='flex gap-2 items-start'>
												<div className='avatar'>
													<div className='w-8 rounded-full'>
														<img
															src={comment.user.profileImg || "/avatar-placeholder.png"}
														/>
													</div>
												</div>
												<div className='flex flex-col'>
													<div className='flex items-center gap-1'>
														<span className='font-bold'>{comment.user.fullName}</span>
														<span className='text-gray-700 text-sm'>
															@{comment.user.username}
														</span>
													</div>
													<div className='text-sm'>{comment.text}</div>
												</div>
											</div>
										))}
									</div>

									{/* Comment input form */}
									<form
										className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
										onSubmit={handlePostComment}
									>
										<textarea
											className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800'
											placeholder='Add a comment...'
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>
										<button className='btn btn-primary rounded-full btn-sm text-white px-4'>
											{isCommenting ? (
												<LoadingSpinner size='md'/>
											) : (
												"Post"
											)}
										</button>
									</form>
								</div>
								<form method='dialog' className='modal-backdrop'>
									<button className='outline-none'>close</button>
								</form>
							</dialog>

							{/* Repost Button */}
							<div className='flex gap-1 items-center group cursor-pointer'
								onClick={handleOpenQuoteModal}>
								<BiRepost className='w-6 h-6  text-slate-500 group-hover:text-green-500' />
								<span className='text-sm text-slate-500 group-hover:text-green-500'>
									{post.quoteCount || 0}
								</span>
							</div>

							{/* Respost Modal */}

                            {/* Repost (Quote Tweet) Modal */}
                            <dialog id={`quote_post_modal${post._id}`} className='modal border-none outline-none'>
                                <div className='modal-box rounded border border-gray-600'>
                                    <h3 className='font-bold text-lg mb-4'>Quote Post</h3>
                                    
                                    {postToQuote && ( 
                                        <CreatePost 
                                            initialQuotedPost={postToQuote} 
                                            onCloseModal={handleCloseQuoteModal} 
                                        />
                                    )}
                                </div>
                                <form method='dialog' className='modal-backdrop'>
                                    <button className='outline-none' onClick={handleCloseQuoteModal}>close</button> 
                                </form>
                            </dialog>

							{/* Like button */}
							<div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
								{isLiking && <LoadingSpinner size='sm' />}
								{!isLiked && !isLiking &&(
									<FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
								)}
								{isLiked && !isLiking && <FaRegHeart className='w-4 h-4 cursor-pointer text-pink-500 ' />}

								<span
									className={`text-sm group-hover:text-pink-500 ${
										isLiked ? "text-pink-500" : " text-slate-500"
									}`}
								>
									{post.likes.length}
								</span>
							</div>
						</div>

						{/* Bookmark icon */}
						<div className='flex w-1/3 justify-end gap-2 items-center'>
							<FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer' />
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Post;