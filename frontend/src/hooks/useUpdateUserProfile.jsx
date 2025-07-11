import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast'

// Custom hook to update the user's profile information
const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    // useMutation handles the update request and related states
    const { mutateAsync:updateProfile, isPending: isUpdatingProfile } = useMutation({
        // Function that sends the POST request with updated user data
        mutationFn: async (formData) => {
            try {
                const res = await fetch(`/api/users/update`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData),
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong!");
                }
                return data;
            } catch (error) {
                throw new Error(error.message);
            }
        },
        // On success, show success toast and refresh relevant queries
        onSuccess: async () => {
            toast.success("Profile updated successfully");

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["authUser"] }),     // Refresh logged-in user data
                queryClient.invalidateQueries({ queryKey: ["userProfile"] }), // Refresh profile being viewed
            ]);
        },
        // On error, show error toast
        onError: (error) => {
            toast.error(error.message);
        }
    });

    // Return the mutation function and its loading state
    return { updateProfile, isUpdatingProfile };
}

export default useUpdateUserProfile;