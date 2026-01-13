import { NextFunction, Request, Response } from "express";
import { User } from "../user/userTypes";
import createHttpError from "http-errors";
import { Order } from "./orderModel";
import Cart from "../cart/cartModel";
import { getCartSummary, reserveItems } from "../payment/helper";

const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const user = req.user as User;

    const { _id } = user;

    if (!_id) {
      return next(createHttpError(400, "Please Logged In first."));
    }

    const allOrders = await Order.find({ userId: _id })
                            .populate("userId", "name")
                            .populate("items.productId", "title price thumbnail discount");

    if (!allOrders) {
      return next(createHttpError(400, "No record found."));
    }

    return res.status(200).json({
      message: "Order fetch succssfully.",
      orders: allOrders,
    });

  } catch (err) {
    return next(createHttpError(400, "Something went wrong"));
  }
}

const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  
  const user = req.user as User;
  const { address_Id } = req.body;

  try {

    if (!address_Id) {
      return next(createHttpError(400, "Address is required"));
    }

    const { _id } = user;

    if (!_id) {
      return next(createHttpError(400, "Please Enter all fields."));
    }

    const cart = await Cart.findOne({userId : _id});

    if(!cart) {
      return next(createHttpError("Cart not found"));
    }

    const { totalAmountInPaise } = await getCartSummary(cart.items);

    const reserved = await reserveItems(cart.items);

    if (!reserved) throw new Error('Some items out of stock');

    const orders = await Order.create({
      userId: _id,
      address_Id,
      items : cart?.items,
      totalAmount : totalAmountInPaise / 100,
    });

    const cartData = await Cart.findOneAndDelete({_id : cart._id});

    return res.status(200).json({
      message: "Order Created Succssfully.",
      orders
    });

  } catch (err) {
    return next(createHttpError(400, "Something went wrong"));
  }
}

const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const user = req.user as User;

    const { item_id } = req.body;

    if (!user?._id || !item_id) {
      return next(createHttpError(400, "Please enter all fields."));
    }

    const order = await Order.findById(item_id);

    if (!order) {
      return next(createHttpError(400, "Please provide a valid order ID."));
    }

    // Calculate time difference
    const now = Date.now();
    const createdAt = new Date(order!.createdAt as string).getTime();
    const timeDiff = now - createdAt;

    const SIX_HOURS = 6 * 60 * 60 * 1000;

    if (timeDiff > SIX_HOURS) {
      return next(
        createHttpError(400, "You can only cancel an order within 6 hours.")
      );
    };

    // Perform cancellation 
    // --- Note - After Payment Integration we need to also handle return user money back.

    order!.payment_status = "Cancel";
    order!.shipping_status = "Cancel";

    await order!.save();

    return res.status(200).json({
      message: "Order cancelled successfully.",
      order,
    });

  } catch (err) {
    return next(createHttpError(400, "Something went wrong"));
  }
};

const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;

    const { _id, address_Id, items } = req.body;

    if (!user || !_id || !address_Id || !items) {
      return next(createHttpError(400, "Please enter all fields."));
    }

    const order = await Order.findById(_id);

    if (!order) {
      return next(createHttpError(400, "Please provide a valid order ID."));
    }

    // Calculate time difference
    const now = Date.now();
    const createdAt = new Date(order!.createdAt as string).getTime();
    const timeDiff = now - createdAt;

    const SIX_HOURS = 6 * 60 * 60 * 1000;

    if (timeDiff > SIX_HOURS) {
      return next(
        createHttpError(400, "You can only update your order within 6 hours.")
      );
    };

    // Perform cancellation 
    // --- Note - After Payment Integration we need to also handle return user money back.
    const updatedOrder = await Order.findByIdAndUpdate(
                                _id,
                                { address_Id, items },
                                { new: true }
                              );


    return res.status(200).json({
      message: "Order cancelled successfully.",
      order: updatedOrder,
    });

  } catch (err) {
    return next(createHttpError(400, "Something went wrong"));
  }
};

//---------------Admin Rotes----------------------//
const getAllOrdersForAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const user = req.user as User;

    const { _id } = user;

    if (!_id) {
      return next(createHttpError(400, "Please Logged In first."));
    }

    const allOrders = await Order.find({});

    if (!allOrders) {
      return next(createHttpError(400, "No record found."));
    }

    return res.status(200).json({
      message: "Order fetch succssfully.",
      orders: allOrders,
    });

  } catch (err) {
    return next(createHttpError(400, "Something went wrong"));
  }
}

const updateUserOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const user = req.user as User;

    const { order_id, shipping_status, payment_status } = req.body;

    const { _id } = user;

    if (!_id || !order_id) {
      return next(createHttpError(400, "Invalid Credentials."));
    }

    const order = await Order.findByIdAndUpdate(order_id, {
      payment_status,
      shipping_status
    });

    if (!order) {
      return next(createHttpError(400, "No record found."));
    }

    return res.status(200).json({
      message: "Order fetch succssfully.",
      order: order,
    });

  } catch (err) {
    return next(createHttpError(400, "Something went wrong"));
  }
}

export { getAllOrders, createOrder, cancelOrder, updateOrder, getAllOrdersForAllUsers, updateUserOrderStatus }