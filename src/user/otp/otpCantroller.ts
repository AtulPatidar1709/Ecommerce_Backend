import createHttpError from "http-errors";
import userModel from "../userModel";
import { NextFunction, Request, Response } from "express";
import { sendOtpService } from "./helper";
import OTP from "./otpModel";
import { verifyIdToken } from "./googleAuth";
import { Session } from "../../session/sessionModels";
import { User } from "../userTypes";
import bcrypt from 'bcrypt';

const ResendOtp = async (req : Request , res : Response, next : NextFunction) => {
  
  try {

    const user = req.user as User;

    if(!user) {
      return createHttpError(404, "User not exsist.");
    }
    
    const { name, email } = user;

    if (user.emailVerified) {
      return createHttpError(400, "User already Verified");
    }

    await sendOtpService(email, name,  "VERIFY_EMAIL");

    return res.status(201).json({
      message : "OTP resent successfully"
    });

  } catch (error) {
    return createHttpError(400, "Something went wrong");
  }
}

const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const { otp } = req.body;

    if(!user || !otp) {
      return next(createHttpError(404, "User not exsist."));
    }
    
    const { email } = user;

    const otpRecord = await OTP.findOne({
      email,
      purpose: "VERIFY_EMAIL",
      used: false,
    });

    if (!otpRecord) {
      return next(createHttpError(403, "Invalid or Expired OTP!"));
    }

    // Check expiry
    if (otpRecord.expiresAt < new Date())
      return next(createHttpError(400, "OTP expired"));

    // Attempt limit
    if (otpRecord.attempts >= 3)
      return next(createHttpError(429, "Too many attempts"));

    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return next(createHttpError(400, "Invalid OTP"));
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    await userModel.findOneAndUpdate({email}, {
      emailVerified : true
    });

    return res.status(201).json({ message: "OTP Verified!" });
  } catch (error) {
    return next(createHttpError(400, "Something went wrong"));
  }
}

const loginWithGoogle = async (req: Request, res: Response, next: NextFunction) => {

  const { credential } = req.body;

  try {
    console.log("User credential is as follows : " , credential);

    const userData = await verifyIdToken(credential);

    if(!userData) {
      return next(createHttpError(400, "Google token did not include an email."));
    }

    const { name, email, picture, sub } = userData;



    if (!name || !email || !picture || !sub) {
      return next(createHttpError(400, "Google token did not include an email."));
    }

    let user = await userModel.findOne({email});

    if(user && !user.emailVerified) {
      await userModel.findByIdAndUpdate(user._id, {
        emailVerified: true
      })
    };

    console.log("User Details is as follows : " , user);

    if (!user) {
      try {
        await userModel.create({
          name, email, picture, emailVerified: true
        });
      } catch (error) {
        return next(createHttpError(404, "Something went wrong try again."));
      }
    };

    if (!user) {
      return next(createHttpError(400, "Please login First."));
    };

    const allSessions = await Session.find({ email });

    if (allSessions.length >= 1) {
      await allSessions[0]!.deleteOne();
    };

    if (!user!.picture!.includes("googleusercontent.com")) {
      user!.picture = picture,
        await user!.save();
    };

    const session = await Session.create({ userId: user!._id });

    const userInfo = {
      id : user._id,
      role : user.role,
      name : user.name,
      email : user.email,
      emailVerified: user.emailVerified,
      picture : user.picture,
    };

    res.cookie("sid", session._id, {
      httpOnly: true,
      signed: true,
      maxAge: 1000 * 60 * 60,
    });

    return res.status(200).json({
      message: "Logged In.",
      user: userInfo
    });

  } catch (error) {
    return next(createHttpError(404, "Something went wrong while Google Login."));
  }
}

export { ResendOtp, verifyOtp, loginWithGoogle }