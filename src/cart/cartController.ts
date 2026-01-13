import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import Cart from "./cartModel";
import { User } from "../user/userTypes";
import { Product } from '../product/productModel';
import { formatCart } from "../helper/formatCart";
import { cartItems } from "./cartTypes";

const getCartData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;

    const cart = await Cart.findByUserId(user._id);

    const result = formatCart(cart);

    return res.status(200).json({
      message: "Cart fetched successfully",
      ...result
    });

  } catch (error) {
    return next(createHttpError(500, "Error fetching cart"));
  }
};

const updateCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    const { productId, quantity } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId: user?._id });
    if (!cart) {
      cart = await Cart.create({ userId: user?._id, items: [] });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId.toString());

    // const currentQty = existingItem ? existingItem.quantity : 0;
    
    if (product.stock < quantity) {
      return next(createHttpError(400, `Only ${product.stock} items in stock`));
    }

    // Update or add item (overwrite quantity)
    if (existingItem) {
      existingItem.quantity = quantity;
    } else {
      cart.items.push({ productId, quantity } as cartItems);
    }

    await cart.save();

    res.status(203).json({
      message: "Cart updated successfully",
    });

  } catch (err) {
    console.error("Update cart error:", err);
    return next(createHttpError(500, "Something went wrong while updating cart"));
  }
};

const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.body;

    const user = req.user as User;

    const { _id } = user;

    if (!_id) {
      return next(createHttpError(400, "Please Logged In first."));
    }

    const cart = await Cart.findOne({ userId: _id });

    if (!cart) {
      return next(createHttpError(404, "Cart Not Found."));
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    await cart.save();

    const populated = await cart.populate("items.productId", "title price images discount");
    const result = formatCart(populated);

    res.status(204).json({ message: "Item removed from cart" });

  } catch (error) {
    return next(createHttpError(400, "Something went wrong while updating to the cart."));
  }
};

const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;

    const { _id } = user;

    if (!_id) {
      return next(createHttpError(400, "Please Logged In first."));
    }

    const deleted = await Cart.findOneAndDelete({ userId: _id });
    if (!deleted) return next(createHttpError(404, "Cart not found"));

    res.status(204).json({ message: "Cart cleared successfully" });
    
  } catch (error) {
    return next(createHttpError(500, "Failed to clear cart"));
  }
};

export { getCartData, updateCart, removeFromCart, clearCart };