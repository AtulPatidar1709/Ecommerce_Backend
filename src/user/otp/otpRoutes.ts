import { Router } from "express";
import { ResendOtp, verifyOtp } from "./otpCantroller";
import checkAuth from "../../middlewares/authMiddleware";

const optRoutes = Router();

optRoutes.post("/resend-otp", checkAuth, ResendOtp);
optRoutes.post("/verify-otp", checkAuth, verifyOtp);

export default optRoutes;