import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { User } from "../user/userTypes";
import Cart from "../cart/cartModel";
import createHttpError from "http-errors";
import { getCartSummary, reserveItems } from "./helper";
import { Order } from "../orders/orderModel";
import { config } from "../config/config";
import { cartTypes } from "../cart/cartTypes";
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';

var rzp = new Razorpay({
  key_id: config.RZP_TEST_API_KEY!,
  key_secret: config.RZP_TEST_KEY_SECRET!,
});

//Initiate Payment
const createRazorpayOrder = async (req : Request, res : Response, next : NextFunction) => {
    try {
      const user = req.user as User;

      const { address_Id, paymentMethod, totalAmount } = req.body;

      if (!address_Id || paymentMethod !== 'ONLINE')
        throw new Error('Missing/invalid payload');
      
      const cart : cartTypes | null = await Cart.findOne({userId : user._id});

      if(!cart) {
        return next(createHttpError(403, "You Cart is Empty."));
      }

      const { totalAmountInPaise } = await getCartSummary(cart.items);

      // 3. optional test override
      const finalPaise = process.env.FORCE_TEST_AMOUNT ? 100 : totalAmountInPaise;

      if (finalPaise !== totalAmount * 100)
        throw new Error("Total amount mismatch");

      const reserved = await reserveItems(cart.items);
      
      if (!reserved) throw new Error('Some items out of stock');

      await Cart.findOneAndDelete({userId : user._id});

      const order = await Order.create({
        userId : user._id,
        address_Id: address_Id,
        items : cart.items,
        payment_status: "PENDING",
        totalAmount: finalPaise / 100,
      });
    
      const rzOrder = await rzp.orders.create({
          amount : finalPaise,
          currency : "INR",
          notes : {orderId : order._id.toString()}
        });

      res.status(200).json({
        order: rzOrder,
        orderDetails : {
          orderDetails_id : order._id,
          orderDetails_amount : finalPaise,
        },
      });

    } catch (error) {
      return next(createHttpError(500, "Error in Payment Initiating " + error));
    }
}

//Verify payment is done or not
const fetchRazorPayOrder = async (req : Request, res : Response, next : NextFunction) => {

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;
  
  try {
    const hmac = crypto.createHmac("sha256", config.RZP_TEST_KEY_SECRET || "")
                  .update(razorpay_order_id + "|" + razorpay_payment_id)
                  .digest("hex");

    if(hmac !== razorpay_signature) {
      return next(createHttpError(400, "Payment Is not Valid"));
    };

    const rzOrder = await rzp.orders.fetch(razorpay_order_id);

    if(rzOrder.status !== 'paid') {
      return res.status(400).json({
        status : "Failed",
        error : "Order Not Paid."
      });
    };

    if(Number(rzOrder.amount) !== Number(orderDetails.orderDetails_amount)){
      return res.status(400).json({ status: "failed", error: "Amount mismatch" });
    };

    const order = await Order.findByIdAndUpdate(
      orderDetails.orderDetails_id,
      {payment_status : "PAID"},
      {new : true}
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.status(200).json({ status: "success", message: "Order placed successfully", order });

  } catch (error) {
    return next(createHttpError(500, "Something Went Wrong."))
  }
}

const fetchRazorPayOrderHook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const received_signature = req.get("x-razorpay-signature");
    const webHookSecret = config.RZP_TEST_KEY_WEBHOOK_SECRET;

    if (!received_signature || !webHookSecret) {
      console.error("Missing signature or secret");
      return next(createHttpError(400, "Invalid signature or missing secret"));
    }
    
    const rawBody = req.body.toString('utf8');

    const isValidSignature = validateWebhookSignature(
      rawBody,
      received_signature,
      webHookSecret
    );

    if (!isValidSignature) {
      console.error("❌ Signature verification failed!");
      return next(createHttpError(400, "Webhook signature verification failed"));
    }

    const payload = JSON.parse(rawBody);
    const orderEntity = payload?.payload?.order?.entity;

    if (!orderEntity || orderEntity.status !== 'paid') {
      return next(createHttpError(400, "Order not paid"));
    }

    const { notes } = orderEntity;
    
    // Update order
    const order = await Order.findByIdAndUpdate(
      { _id: notes.orderId, payment_status: { $ne: "PAID" } },
      { payment_status: "PAID" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Order placed successfully",
      order
    });

  } catch (error) {
    console.error("Webhook error:", error);
    // Still send 200 to prevent retry storms
    res.status(200).send("OK");
  }
};
export { createRazorpayOrder, fetchRazorPayOrder, fetchRazorPayOrderHook};