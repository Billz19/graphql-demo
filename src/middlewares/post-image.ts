import { NextFunction, Request, Response } from "express";
import { clearImage, prepareError } from "../utils/utils";

const postImage = (req:Request,resp: Response,next:NextFunction) =>{
    if (!(req as any).isAuth) {
        throw prepareError('User unauthenticated', 401)
    }
    if(!req.file){
        return resp.status(200).json({message: 'No file provided!'})
    }
    if(req.body.oldPath){
        clearImage(req.body.oldPath)
    }
    return resp.status(201).json({message: 'Image uploaded',filePath: req.file.path})
}

export default postImage;