import { Schema, model, Document } from "mongoose";

export interface PostDocument extends Document {
    title?: string;
    content?: string;
    imageUrl?: string;
    creator?: {
        name: string
    } | string
}

const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    creator: {
       type: Schema.Types.ObjectId,
       ref: 'User',
       required: true
    }
}, { timestamps: true });

const Post = model('Post', postSchema);

export default Post;