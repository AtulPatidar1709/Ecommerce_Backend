import { Document, Types } from "mongoose";

export interface addressTypes extends Document {
  userId: Types.ObjectId,
  line1: string,
  line2?: string,
  city: string,
  state: string,
  zipCode: string,
  number?: number,
} 