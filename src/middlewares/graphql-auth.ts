import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

const setAuthFailed = (req:Request) => {
    (req as any).isAuth = false;
}

const Auth = (req: Request, resp: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        setAuthFailed(req)
        return next()
    }
    const token = authHeader.split(' ')[1];
    let tokenDecoded;
    try {
        tokenDecoded = verify(token, 'MySuperSecret');
    } catch (error) {
        setAuthFailed(req)
        return next()
    }
    if (!tokenDecoded) {
        setAuthFailed(req)
        return next()
    }
    (req as any).isAuth = true;
    (req as any).userId = (tokenDecoded as any).userId
    next();

}

export default Auth;