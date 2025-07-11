import Notification from "../models/notification.model.js";

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id; // Get current user ID
        
        // Find notifications sent to this user, include sender info (username and profile image)
        const notifications = await Notification.find({ to: userId }).populate({
            path: "from",
            select: "username profileImage"
        });

        // Mark all these notifications as read
        await Notification.updateMany({ to: userId }, { read: true });

        // Send back the notifications
        res.status(200).json(notifications);
    } catch (error) {
        console.log("Error in getNotifications function", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// Delete all notifications for the logged-in user
export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id; // Get current user ID

        // Delete all notifications for this user
        await Notification.deleteMany({ to: userId });
        res.status(200).json({ message: "Notifications deleted successfully" });
    } catch (error) {
        console.log("Error in deleteNotifications function", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}