import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    fullName:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
        minLength: 6,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    followers: [
        { 
            type: mongoose.Schema.Types.ObjectId, // Character ID
            ref: "User",
            default: [] // Start with 0 followers
        }
    ],
    following: [
        { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [] // Start with 0 following
        }
    ],

    profileImg:{
        type: String,
        default: "",
    },
    coverImg:{
        type: String,
        default: "",
    },

    link:{
        type: String,
        default: "",
    },
    likedPosts:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: [],
        },
    ],
},{timestamps: true})


const User = mongoose.model("User", userSchema);

export default User;