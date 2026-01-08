import { User } from "../user/userTypes";
import { config } from "../config/config";
import userModel from "../user/userModel";
import createHttpError from "http-errors";
import { Session } from "../session/sessionModels";
import { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
  const { sid } = req.signedCookies;

  if (!sid) {
    return next(createHttpError(401, "Please Login First."));
  }

  const session = await Session.findOne({_id : sid});

  if(!session) {
    
    res.clearCookie("sid", {
      httpOnly: true,
      signed: true,
      secure: config.enviroment === "production",
      maxAge: 1000 * 60 * 60,
    });
    
    return next(createHttpError(404, "Please login first."));
  }

  const user = await userModel.findById({_id : session!.userId});

  if (!user) {
    return next(createHttpError(404, "No User Found. Plase Create an Account."));
  }

  req.user = user as User;

  next();
}

export default checkAuth;

export const authSocket = async (socket: any, next: (err?: Error) => void) => {
  try {
    // 1. Get raw cookies from the handshake headers
    const sid = socket.request.signedCookies?.sid;

    if (!sid) {
      socket.user = null;
      socket.userId = null; 
      return next();
    }

    // 4. Validate session in Database
    const session = await Session.findOne({ _id: sid });
    if (!session) {
      socket.user = null;
      socket.userId = null;
      return next();
    }

    // 5. Find User
    const user = await userModel.findById(session.userId);
    socket.user = user || null;
    socket.userId = user ? user._id : null;
    next();
  } catch (error) {
    console.error("Socket Auth Error:", error);
    next(new Error("Internal Server Error"));
  }
};