import { Request } from "express";
import User, { UserDocument } from "../models/User";
import { hash, compare } from "bcrypt";
import validator from "validator"
import { prepareError, clearImage } from "../utils/utils";
import { sign } from "jsonwebtoken";
import Post, { PostDocument } from "../models/Post";

export const createUser = async (args: any, req: Request) => {
    const errors = [];
    const { email, password, name } = args.inputUser
    try {
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            throw new Error('User already exists!');
        }
        if (!validator.isEmail(email)) {
            const err = prepareError('Invalid Email', 422);
            errors.push(err);
        }
        if (!validator.isLength(password, { min: 5 }) || !validator.matches(password, /\d/)) {
            const err = prepareError('Password must be a 5 character at least and contains numbers', 422);
            errors.push(err);
        }
        if (validator.isEmpty(name)) {
            const err = prepareError('Name is required', 422);
            errors.push(err);
        }
        if (errors.length) {
            throw prepareError('Invalid input', 422, errors);
        }

        const hashedPass = await hash(password, 12)
        const user = new User({
            email,
            password: hashedPass,
            name
        });
        const createdUser = await user.save();
        return { ...(createdUser as any)._doc, _id: createdUser._id.toString() }
    } catch (error) {
        throw error
    }
}

export const login = async ({ email, password }: { email: string; password: string }) => {
    try {
        const user = await User.findOne({ email }) as UserDocument;
        if (!user) {
            throw prepareError('User could not be found', 401);
        }
        const isEqual = await compare(password, user.password!);
        if (!isEqual) {
            throw prepareError('Password incorrect', 401)
        }
        const token = sign({
            userId: user._id.toString(),
            email,
        }, 'MySuperSecret', { expiresIn: '1h' });
        return {
            userId: user._id.toString(),
            token
        };
    } catch (error) {
        throw error
    }
}

export const createPost = async ({ inputPost }: { inputPost: { [key: string]: string } }, req: Request) => {
    if (!(req as any).isAuth) {
        throw prepareError('User unauthenticated', 401)
    }
    const userId = (req as any).userId;
    const { title, content, imageUrl } = inputPost;
    const errors = [];
    try {
        if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
            errors.push(prepareError('Title is required and must be more than 4 character', 422))
        }
        if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
            errors.push(prepareError('Content is required and must be more than 4 character', 422))
        }
        if (errors.length) {
            throw prepareError('Creation of post failed', 422, errors)
        }
        const user = await User.findById(userId) as UserDocument;
        if (!user) {
            throw prepareError('User not found', 401)
        }
        const post = new Post({ title, content, imageUrl, creator: user });
        const createdPost = await post.save() as PostDocument;
        user.posts!.push(createdPost);
        await user.save();
        return {
            ...(createdPost as any)._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt!.toISOString(),
            updatedAt: createdPost.updatedAt!.toISOString(),
        }

    } catch (error) {
        throw error
    }
};


export const getPosts = async ({ page }: { page: number }, req: Request) => {
    if (!(req as any).isAuth) {
        throw prepareError('User unauthenticated', 401)
    }
    try {
        if (!page) {
            page = 1;
        }
        const perPage = 2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort({ createdAt: -1 })
            .populate('creator') as PostDocument[];

        return {
            totalPosts,
            posts: posts.map(post => ({
                ...(post as any)._doc,
                _id: post._id.toString(),
                createdAt: post.createdAt!.toISOString(),
                updatedAt: post.updatedAt!.toISOString()
            }))
        }

    } catch (error) {
        throw error
    }
}


export const getPost = async ({ id }: { id: string }, req: Request) => {
    if (!(req as any).isAuth) {
        throw prepareError('User unauthenticated', 401)
    }

    try {
        const post = await Post.findById(id).populate('creator') as PostDocument;
        if (!post) {
            throw prepareError('Post not found!', 404)
        }
        return {
            ...(post as any)._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt!.toISOString(),
            updatedAt: post.updatedAt!.toISOString()
        }

    } catch (error) {
        throw error
    }
};


export const updatePost = async ({ id, inputPost }: { id: string, inputPost: { [key: string]: string } }, req: Request) => {
    const { title, content, imageUrl } = inputPost;
    const errors = [];
    if (!(req as any).isAuth) {
        throw prepareError('User unauthenticated', 401)
    }
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
        errors.push(prepareError('Title is required and must be more than 4 character', 422))
    }
    if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
        errors.push(prepareError('Content is required and must be more than 4 character', 422))
    }
    if (errors.length) {
        throw prepareError('Creation of post failed', 422, errors);
    }
    try {
        const post = await Post.findById(id).populate('creator') as PostDocument;
        if (!post) {
            throw prepareError('Post not found!', 404);
        }
        if ((post.creator as any)._id.toString() !== (req as any).userId.toString()) {
            throw prepareError('User unauthorized!', 403);
        }

        post.title = title;
        post.content = content;
        if (imageUrl !== 'undefined') {
            post.imageUrl = imageUrl;
        }
        const updatedPost = await post.save();

        return {
            ...(updatedPost as any)._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt!.toISOString(),
            updatedAt: updatedPost.updatedAt!.toISOString()
        }

    } catch (error) {
        throw error
    }

}


export const deletePost = async ({ id }: { id: string }, req: Request) => {
    if (!(req as any).isAuth) {
        throw prepareError('User unauthenticated', 401)
    }
    const userId = (req as any).userId;
    try {
        const post = await Post.findById(id) as PostDocument;
        if (!post) {
            throw prepareError('Post not found!', 404);
        }
        if (post.creator!.toString() !== userId) {
            throw prepareError('User unauthorized!', 403);
        }
        clearImage(post.imageUrl!);
        await Post.findByIdAndDelete(id);
        const user = await User.findById(userId) as UserDocument;
        (user.posts! as any).pull(id)
        await user.save();
        return true;
    } catch (error) {
        throw error
    }
};

export const getUserStatus = async (_:any, req: Request) => {
    if (!(req as any).isAuth) {
        throw prepareError('User unauthenticated', 401)
    }
    const userId = (req as any).userId;
    try {
        const user = await User.findById(userId) as UserDocument;

        if (!user) {
            throw prepareError('User not found!', 404);
        }
        return {
            status: user.status!
        }
        
    } catch (error) {
        throw error
    }

};

export const updateStatus = async ({status}:{status:string},req:Request)=>{
    if (!(req as any).isAuth) {
        throw prepareError('User unauthenticated', 401)
    }
    const userId = (req as any).userId;
    try {
        const user = await User.findById(userId) as UserDocument;

        if (!user) {
            throw prepareError('User not found!', 404);
        }
        user.status = status;
        const updatedUser = await user.save();
        return {
            status: updatedUser.status!
        }

    } catch (error) {
        throw error
    }
}