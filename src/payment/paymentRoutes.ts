import express from "express";
import { createRazorpayOrder, fetchRazorPayOrder, fetchRazorPayOrderHook } from "./paymentController";
import checkAuth from "../middlewares/authMiddleware";

const paymentRoutes = express.Router();

paymentRoutes.post("/initiate-payment" , checkAuth, createRazorpayOrder);
paymentRoutes.post("/verify-payment" , checkAuth, fetchRazorPayOrder);

//Hook for verify Payment
paymentRoutes.post('/payment-verify', fetchRazorPayOrderHook);

export default paymentRoutes;