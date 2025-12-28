import bcrypt from 'bcrypt';
import { User } from "./userTypes";
import userModel from "./userModel";
import { config } from "../config/config";
import createHttpError from "http-errors";
import { sendOtpService } from "./otp/helper";
import { Session } from "../session/sessionModels";
import { NextFunction, Request, Response } from "express";

const registerUser = async (req: Request, res: Response, next: NextFunction) => {

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(createHttpError(400, "Please Enter All Detail's"))
    }

    const userExsist = await userModel.findOne({ email });

    if (userExsist) {
      return next(createHttpError(400, "User already exists with this email."));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user: User = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const session = await Session.create({ userId: user?._id });

    await sendOtpService(email, name, "VERIFY_EMAIL");

    const userInfo = {
      id : user._id,
      role : user.role,
      name : user.name,
      email : user.email,
      emailVerified: user?.emailVerified,
      picture : user?.picture,
    }

    res.cookie("sid", session._id, {
      httpOnly: true,
      signed: true,
      secure: config.enviroment === "production",
      maxAge : 1000 * 60 * 60, 
    });

    res.status(201).json({
      message: "logged in",
      user: userInfo,
      redirectTo: "/verify-otp",
    });

  } catch (error) {
    return next(createHttpError(500, "Error while creating user."));
  }
}

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return next(createHttpError(400, "Please Enter All Detail's"))
    }
    
    const user = await userModel.findOne({ email : email });
    
    if (!user || user === undefined || !user._id) {
      return next(createHttpError(400, "Create an Account first."));
    }

    const passwordMatch = await bcrypt.compare(password, user?.password as string);

    if (!passwordMatch) {
      return next(createHttpError(400, "Invalid Cradentials"));
    }

    const session = await Session.create({ userId: user!._id });

    const userInfo = {
      id : user._id,
      role : user.role,
      name : user.name,
      email : user.email,
      emailVerified: user.emailVerified,
      picture : user.picture,
    }

    res.cookie("sid", session?._id, {
      httpOnly: true,
      signed: true,
      secure: config.enviroment === "production",
      maxAge: 1000 * 60 * 60,
    })

    res.status(201).json({
      message : "User LoggedIn Successfully.",
      user : userInfo
    });

  } catch (error) {
    return next(createHttpError(500, "Error while creating user."));
  }
}

const userInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
        
    const { _id } = user;

    if (!_id) {
      return next(createHttpError(400, "Please Logged In first."));
    }
    
    const userInfo = {
      id : user._id,
      role : user.role,
      name : user.name,
      email : user.email,
      emailVerified: user.emailVerified,
      picture : user.picture,
    }

    return res.status(200).json({
      message : "User Info fetch successfully.",
      user : userInfo
    });

  } catch (error) {
    return next(createHttpError(401, "Somthing went wrong while fetching User info."))    
  }
}

const userLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
        
    const { _id } = user;

    if (!_id) {
      return next(createHttpError(400, "Please Logged In first."));
    }

    await Session.findOneAndDelete({ userId: _id });
    
    res.clearCookie("sid");

    return res.status(200).json({
      message: "User logged out successfully."
    });

  } catch(err) {
    return next(createHttpError(400, "Error while logging out."))
  }
}

export { registerUser, userInfo, loginUser, userLogout }