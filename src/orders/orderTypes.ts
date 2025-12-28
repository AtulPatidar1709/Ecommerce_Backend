import { Document, Types } from "mongoose";

export interface orderTypes extends Document {
  userId: Types.ObjectId,
  address_Id: Types.ObjectId,
  items: [{
    productId: Types.ObjectId,
    quantity: number,
  }],
  payment_status: string,
  shipping_status: string,
  totalAmount: number,
  createdAt?: string,
  updatedAt?: string,
}