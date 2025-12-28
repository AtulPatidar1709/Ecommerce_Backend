import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { User } from "../user/userTypes";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(createHttpError(401, "Please log in first."))
    }
    const { _id, role } = req.user as User;

    if (!_id) {
      return next(createHttpError(404, "Please Logged in first."));
    }
    if (role !== 'Admin') {
      return next(createHttpError(404, "Admin Only Route."));
    }
    next();
  } catch (error) {
    return next(createHttpError(400, "Something went wrong"));
  }
}

export default isAdmin;