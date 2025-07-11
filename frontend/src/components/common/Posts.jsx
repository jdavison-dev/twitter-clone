// Import the Post component for displaying individual posts
import Post from "./Post";

// Import skeleton UI component to show while loading posts
import PostSkeleton from "../skeletons/PostSkeleton";

// React Query hook for data fetching and caching
import { useQuery } from "@tanstack/react-query";

// Posts component handles rendering posts based on the selected feed type
const Posts = ({ feedType, username, userId }) => {
	// Helper function to determine the correct API endpoint based on the feed type
	const getPostEndpoint = () => {
		switch (feedType) {
			case "forYou":
				return "/api/posts/all"; // Shows all posts
			case "following":
				return "/api/posts/following"; // Shows posts from followed users
			case "posts":
				return `/api/posts/user/${username}`; // Shows posts by a specific user
			case "likes":
				return `/api/posts/likes/${userId}`; // Shows posts liked by the user
			default:
				return "/api/posts/all"; // Fallback to all posts
		}
	};

	// Fetch posts using React Query
	const { data: posts, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["posts", feedType, username, userId], // Cache key depends on feed type and user
		queryFn: async () => {
			try {
				const POST_ENDPOINT = getPostEndpoint(); // Determine the endpoint
				const res = await fetch(POST_ENDPOINT); // Make the request
				const data = await res.json(); // Parse the response

				if (!res.ok) {
					// Handle server errors
					throw new Error(data.error || "Something went wrong");
				}

				return data; // Return post data to React Query
			} catch (error) {
				// Catch fetch or parsing errors
				throw new Error(error);
			}
		},
	});

	return (
		<>
			{/* Show loading skeletons while data is loading or being refetched */}
			{(isLoading || isRefetching) && (
				<div className='flex flex-col justify-center'>
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}

			{/* Show a message if no posts are available */}
			{!isLoading && !isRefetching && posts?.length === 0 && (
				<p className='text-center my-4'>No posts in this tab. Switch 👻</p>
			)}

			{/* Render the list of posts once they are loaded */}
			{!isLoading && !isRefetching && posts && (
				<div>
					{posts.map((post) => (
						<Post key={post._id} post={post} />
					))}
				</div>
			)}
		</>
	);
};

export default Posts;