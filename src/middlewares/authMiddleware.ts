import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "../user/userModel";
import { User } from "../user/userTypes";
import { Session } from "../session/sessionModels";
import { config } from "../config/config";

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