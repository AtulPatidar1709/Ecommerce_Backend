import { Schema, model } from "mongoose";
import { OtpTypes } from "./otpTypes";

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["VERIFY_EMAIL", "LOGIN", "RESET_PASSWORD"],
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 60 }, // TTL
    },

    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const OTP = model<OtpTypes>("OTP", otpSchema);

export default OTP;


