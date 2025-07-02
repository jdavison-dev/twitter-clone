import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateTokenAndSetCookie } from '../lib/utils/generateToken.js';

export const signup = async (req, res) => {
    try {
        // Extract user data from the request body
        const {fullName, username, email, password} = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Check if user email is valid with regex
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

         // Check for existing username
        const existingUser = await User.findOne({ username:username });
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken" });
        }

        // Check for existing email
        const existingEmail = await User.findOne({ email }); 
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already taken" });
        }

        // Very basic password strength check
        if(password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long." });
        }
        // Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            fullName,
            username,
            email,
            password:hashedPassword // Save HASHED ONLY
        });

        // If user is created
        if(newUser) {
            // Generate a JWT and set it as an HTTP cookie
            generateTokenAndSetCookie(newUser._id,res);
            await newUser.save(); // This saves to database

            // Return the user data
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
            res.status(400).json({ error: "Invalid user data" });
        }

    } catch(error) {
        console.log("Error in signup controller", error.message);

        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const login = async (req, res) => {
    try {
        const {username,password} = req.body;
        const user = await User.findOne({username});                                    // Find user data by username
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || ""); // Compare password with hashed password

        if(!user || !isPasswordCorrect){
            return res.status(400).json({error: "Invalid username or passwrod"})
        }

        generateTokenAndSetCookie(user._id, res);
        
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
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logout = async (req, res) => {
    try {
        // Clear the JWT cookie by settings it to empty and immediately expiring it
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message:"Logged out succusfully"})
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ error: "Internal Server Error" }); 
    }
};

export const getMe = async (req, res) => {
    try {
        // req.user is expected to be set by authentication middleware
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getMe controller", error.message);
        res.status(500).json({ error: "Internal Server Error "});
    }
};