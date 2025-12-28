import mongoose, { Types } from "mongoose";
import { model } from "mongoose";
import { Schema } from "mongoose";
import { CartModel, cartTypes } from "./cartTypes";

const cartItemSchema = new Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 99,
    default: 1
  },
}, { _id: false });

const cartSchema = new Schema<cartTypes>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },
  items: [cartItemSchema],
}, { timestamps: true });

// Schema methods
cartSchema.statics.findByUserId = async function (userId: Types.ObjectId) {
  let cart = await this.findOne({ userId })
    .populate("items.productId", "title price thumbnail quantity discount");

  if (!cart) {
    cart = await this.create({ userId, items: [] });
  }

  return cart;
};

const Cart = model<cartTypes, CartModel>("Cart", cartSchema);

export default Cart;