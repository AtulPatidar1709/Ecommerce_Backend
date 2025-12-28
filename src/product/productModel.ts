import { model, Schema } from "mongoose";
import { ProductType } from "./productTypes";

const productSchema = new Schema<ProductType>({
  title: {
    type: String,
    required: true,
    minlength: 6,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: 1,
  },
  description: {
    type: String,
    required: true,
    minlength: 8
  },
  stock: {
    type: Number,
    required: true,
    min: 1,
  },
  discount: {
    type: Number,
    default: 0,
  },
  images: {
    type: [String],
    required: true,
  },
  thumbnail: {
    type: String,
    required: true
  }
}, { timestamps: true });

export const Product = model<ProductType>("Product", productSchema);