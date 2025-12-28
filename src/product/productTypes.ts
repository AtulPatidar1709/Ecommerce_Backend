import { Document } from "mongoose";

export interface ProductType extends Document {
  title: string,
  description: string,
  stock: number,
  discount: number
  images: string[],
  thumbnail: string,
  price: number,
  createdAt?: Date;
  updatedAt?: Date;
}
