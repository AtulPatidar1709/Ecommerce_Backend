import { Document } from "mongoose";
import { Types } from "mongoose";

export interface sessionTypes extends Document {
  userId: Types.ObjectId,
  createdAt?: Date
}