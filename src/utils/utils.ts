import { NextFunction } from "express";
import { unlink } from "fs";
import { join } from "path";


export const handleErrors = (next: NextFunction, error: any) => {
    if (!error.statusCode) {
        error.statusCode = 500;
    }
    next(error);
}

export const prepareError = (message: string, statusCode: number, data?:any): Error => {
    const error = new Error(message);
    (error as any).statusCode = statusCode
    if(data){
      (error as any).data = data;  
    }
    return error
}


export const clearImage = (imagePath: string) => {
    unlink(join(__dirname, '..', '..', imagePath), (error => console.log('clearImage', error)))
}
