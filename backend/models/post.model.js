import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text:{
        type: String,
    },
    img: {
        type: String, // This will store the Cloudinary URL
        default: null, // Makes the image field optional
    },
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    comments:[
        {
            text:{
                type: String,
                required: true
            },
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        },
    ],
    quotedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        default: null
    },
}, { timestamps: true })

const Post = mongoose.model("Post", postSchema);

export default Post;