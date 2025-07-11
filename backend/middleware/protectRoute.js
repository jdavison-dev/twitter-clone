import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

// Middleware to protect routes by verifying JWT token
export const protectRoute = async (req, res, next) => {
    try {
        // Get token from cookies
        const token = req.cookies.jwt;
        if(!token) {
            return res.status(401).json({error: "Unauthorized: No Token Provided"});
        }

        // Verify and decode the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded) {
            return res.status(401).json({error: "Unauthorized: Invalid Token"});
        }

        // Find the user by ID in the token (exclude password)
        const user = await User.findById(decoded.userId).select("-password");

        if(!user) {
            return res.status(404).json({error: "User not found"});
        }

        // Attach user to request object for access in route handlers
        req.user = user;
        next(); // Continue to the next middleware or route
    } catch (err) {
        console.log("Error in protectRoute middleware", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}