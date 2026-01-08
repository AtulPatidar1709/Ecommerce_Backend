import { model, Schema } from "mongoose";
import { User } from "./userTypes";
import { config } from "../config/config";

const userModel = new Schema<User>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    enum: ["User", "Admin", "Worker"],
    default: "User"
  },
  emailVerified: {
    type: Boolean,
    required: true,
    default: false
  },
  picture: {
    type: String,
    default: `${config.buildDomain}/images/default-user.jpg`,
  },
}, { timestamps: true });

export default model<User>("User", userModel);