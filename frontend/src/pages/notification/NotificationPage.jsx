import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import LoadingSpinner from "../../components/common/LoadingSpinner";

import { IoSettingsOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";

const NotificationPage = () => {
	// React Query client instance to manage cache and queries
	const queryClient = useQueryClient();

	// Fetch notifications with React Query
	const { data: notifications, isLoading } = useQuery({
		queryKey: ['notifications'],
		queryFn: async () => {
			try {
				const res = await fetch('/api/notifications');
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
	});

	// Mutation to delete all notifications
	const { mutate: deleteNotifications } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch('/api/notifications', {
					method: 'DELETE',
				});
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			toast.success('Notifications deleted successfully');
			// Refresh notifications after deletion
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	return (
		<>
			{/* Main container for notifications page */}
			<div className='flex-[4_4_0] border-l border-r border-gray-700 min-h-screen'>
				{/* Header with title and settings dropdown */}
				<div className='flex justify-between items-center p-4 border-b border-gray-700'>
					<p className='font-bold'>Notifications</p>
					<div className='dropdown '>
						{/* Settings icon toggles dropdown */}
						<div tabIndex={0} role='button' className='m-1'>
							<IoSettingsOutline className='w-4' />
						</div>
						{/* Dropdown menu for notification actions */}
						<ul
							tabIndex={0}
							className='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52'
						>
							<li>
								{/* Delete all notifications action */}
								<a onClick={deleteNotifications}>Delete all notifications</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Loading spinner while fetching notifications */}
				{isLoading && (
					<div className='flex justify-center h-full items-center'>
						<LoadingSpinner size='lg' />
					</div>
				)}

				{/* Show message if no notifications */}
				{notifications?.length === 0 && (
					<div className='text-center p-4 font-bold'>No notifications 🤔</div>
				)}

				{/* List all notifications */}
				{notifications?.map((notification) => (
					<div className='border-b border-gray-700' key={notification._id}>
						<div className='flex gap-2 p-4'>
							{/* Show icon based on notification type */}
							{notification.type === "follow" && (
								<FaUser className='w-7 h-7 text-primary' />
							)}
							{notification.type === "like" && (
								<FaHeart className='w-7 h-7 text-red-500' />
							)}

							{/* Link to user profile who generated the notification */}
							<Link to={`/profile/${notification.from.username}`}>
								<div className='avatar'>
									<div className='w-8 rounded-full'>
										<img
											src={
												notification.from.profileImg ||
												"/avatar-placeholder.png"
											}
										/>
									</div>
								</div>
								{/* Notification text */}
								<div className='flex gap-1'>
									<span className='font-bold'>@{notification.from.username}</span>{" "}
									{notification.type === "follow"
										? "followed you"
										: "liked your post"}
								</div>
							</Link>
						</div>
					</div>
				))}
			</div>
		</>
	);
};

export default NotificationPage;