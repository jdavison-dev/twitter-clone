import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateTokenAndSetCookie } from '../lib/utils/generateToken.js';

// Controller function to handle user signup
export const signup = async (req, res) => {
	try {
		// Extract user details from the request body
		const { fullName, username, email, password } = req.body;

		// Basic email format validation using regex
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: "Invalid email format" });
		}

		// Check if username already exists in the database
		const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(400).json({ error: "Username is already taken" });
		}

		// Check if email already exists in the database
		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ error: "Email is already taken" });
		}

		// Enforce minimum password length of 6 characters
		if (password.length < 6) {
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}

		// Generate a salt and hash the password securely
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create a new User instance with hashed password and other details
		const newUser = new User({
			fullName,
			username,
			email,
			password: hashedPassword,
		});

		if (newUser) {
			// Generate a JWT token and set it as a cookie in the response
			generateTokenAndSetCookie(newUser._id, res);
			// Save the new user to the database
			await newUser.save();

			// Send back user info (excluding sensitive data like password)
			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				email: newUser.email,
				followers: newUser.followers,
				following: newUser.following,
				profileImg: newUser.profileImg,
				coverImg: newUser.coverImg,
			});
		} else {
			// If user creation failed, respond with an error
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		// Log the error and respond with a generic server error status
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Controller function to handle user login
export const login = async (req, res) => {
    try {
        // Extract username and password from request body
        const {username, password} = req.body;

        // Find user by username in the database
        const user = await User.findOne({username});                                    

        // Compare provided password with stored hashed password
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || ""); 

        // If user not found or password doesn't match, respond with error
        if(!user || !isPasswordCorrect){
            return res.status(400).json({error: "Invalid username or passwrod"})
        }

        // Generate JWT token and set it as a cookie in the response
        generateTokenAndSetCookie(user._id, res);
        
        // Respond with user data (excluding password)
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
        });

    } catch (error) {
        // Log the error and respond with a generic server error status
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Controller function to handle user logout
export const logout = async (req, res) => {
    try {
        // Clear the JWT cookie by setting it to an empty string and expiring it immediately
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message:"Logged out succusfully"})
    } catch (error) {
        // Log the error and respond with a generic server error status
        console.log("Error in logout controller", error.message);
        res.status(500).json({ error: "Internal Server Error" }); 
    }
};

// Controller function to get data of the currently authenticated user
export const getMe = async (req, res) => {
    try {
        // Find the user by ID and exclude the password field from the returned data
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error) {
        // Log the error and respond with a generic server error status
        console.log("Error in getMe controller", error.message);
        res.status(500).json({ error: "Internal Server Error "});
    }
};