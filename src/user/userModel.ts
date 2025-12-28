import { model, Schema } from "mongoose";
import { User } from "./userTypes";

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
    default:
      "https://static.vecteezy.com/system/resources/previews/002/318/271/non_2x/user-profile-icon-free-vector.jpg",
  },
}, { timestamps: true });

export default model<User>("User", userModel);