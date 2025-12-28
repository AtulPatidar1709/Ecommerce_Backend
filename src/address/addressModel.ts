import { model, Schema } from "mongoose";
import { addressTypes } from "./addressTypes";

const addressModel = new Schema<addressTypes>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  line1: {
    type: String,
    required: true,
    minLen: 10
  },
  line2: {
    type: String,
    minLen: 10,
  },
  city: {
    type: String,
    required: true,
    minLen: 4
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
    minLen: 6,
  },
  number: {
    type: Number,
  }
}, { timestamps: true });

export const Address = model<addressTypes>("Address", addressModel);