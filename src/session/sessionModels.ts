import { sessionTypes } from './sessionTypes';
import { Schema, model } from "mongoose";

const sessionModel = new Schema<sessionTypes>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 60 * 60,
  }
}, {
  strict: "throw"
});

export const Session = model<sessionTypes>("Session", sessionModel); 