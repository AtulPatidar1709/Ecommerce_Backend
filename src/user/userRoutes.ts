import express from "express";
import { loginUser, registerUser, userInfo, userLogout } from "./userController";
import checkAuth from "../middlewares/authMiddleware";
import { loginWithGoogle } from "./otp/otpCantroller";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/info", checkAuth, userInfo);
userRouter.get('/logout', checkAuth, userLogout);

//
userRouter.post("/login/google", loginWithGoogle);

export default userRouter;