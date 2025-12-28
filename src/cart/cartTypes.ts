import { ProductType } from './../product/productTypes';
import { Document, Model, Schema, Types } from "mongoose";

// Document interface

export interface cartCreate {
  productId: Types.ObjectId;
  quantity: number;
}

export interface cartItems extends Document {
  productId: Types.ObjectId;
  quantity: number;
  title?: string;
  images?: string[];
  price?: number;
  discount?: number,
}

export interface cartTypes extends Document {
  userId: Types.ObjectId;
  items: cartItems[];
}

export interface CartModel extends Model<cartTypes> {
  findByUserId(userId: Types.ObjectId): Promise<cartTypes>;
}