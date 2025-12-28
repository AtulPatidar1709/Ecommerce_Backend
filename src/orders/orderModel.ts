import { model, Schema } from "mongoose";
import { orderTypes } from "./orderTypes";

const orderModel = new Schema<orderTypes>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  address_Id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Address",
  },
  items: {
    type: [{
      productId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Product"
      },
      quantity: {
        type: String,
        required: true
      }
    }],
    required: true,
  },
  payment_status: {
    type: String,
    enum: ['COD', 'PENDING', 'PAID', 'Cancel'],
    default: 'COD',
  },
  shipping_status: {
    type: String,
    enum: ['Pending', 'Picked', 'Shipped', 'Deliverd', 'Cancel'],
    default: 'Pending'
  },
  totalAmount : {
    type : Number,
    required: true,
  }
}, { timestamps: true });

export const Order = model<orderTypes>("Order", orderModel);