import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Custom hook to handle follow/unfollow logic
const useFollow = () => {
	// Used to manually refresh cache entries after follow/unfollow
	const queryClient = useQueryClient();

	// Mutation function to send follow/unfollow request
	const { mutate: follow, isPending } = useMutation({
		mutationFn: async (userId) => {
			try {
				// Send POST request to follow/unfollow user
				const res = await fetch(`/api/users/follow/${userId}`, {
					method: "POST",
				});

				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong!");
				}
				return;
			} catch (error) {
				throw new Error(error.message);
			}
		},
		onSuccess: () => {
			// Invalidate cache so UI updates with new follow data
			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }), // refresh right panel
				queryClient.invalidateQueries({ queryKey: ["authUser"] }),       // refresh logged-in user
			]);
		},
		onError: (error) => {
			// Show error toast if request fails
			toast.error(error.message);
		},
	});

	// Return follow function and loading state
	return { follow, isPending };
};

export default useFollow;