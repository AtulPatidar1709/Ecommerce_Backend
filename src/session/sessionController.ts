import { NextFunction, Request, Response } from "express";
import { User } from "../user/userTypes";
import createHttpError from "http-errors";
import { Session } from "./sessionModels";

const getAllUserSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const user = req.user as User;

    if (!user) {
      return next(createHttpError(400, "Please LogIn first."));
    }

    const sessions = await Session.find({ userId: user._id });

    if (sessions.length > 1) {
      const lastSession = sessions[ sessions.length - 1 ];

      if(!lastSession) {
        return next(createHttpError(404, "Session Not Found"));
      }
      
      await Session.findByIdAndDelete(lastSession._id);
    }

    return res.status(201).json({
      message: "Session fetched.",
      session: sessions[0]
    });

  } catch (error) {
    return next(createHttpError(400, "Failed to fetch error."))
  }
}

const createUserSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { _id } = req?.body;

    if (!_id) {
      return next(createHttpError(400, "Please LogIn first."));
    }

    const sessions = await Session.find({ userId : _id });

    if (sessions.length >= 1) {
      const lastSession = sessions[0] ;
      if (lastSession) {
        await Session.findByIdAndDelete(lastSession._id);
      }
    }

    const session = await Session.create({
      userId: _id,
    });

    res.status(200).json({ message: "Session created", session });
  } catch (error) {
    return next(createHttpError(400, "Failed to fetch error."))
  }
}

const deleteSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sid } = req?.signedCookies;
    if (!sid) {
      return next(createHttpError(400, "Please LogIn first."));
    }
    await Session.findOneAndDelete({ id: sid });
    res.status(200).json({ message: "Session Deleted Successfully" });
  } catch (error) {
    return next(createHttpError(400, "Failed to fetch error."))
  }
}

export { getAllUserSessions, createUserSession, deleteSession };