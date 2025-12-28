import { Router } from "express";
import { clearCart, getCartData, removeFromCart, updateCart } from "./cartController";
import checkAuth from "../middlewares/authMiddleware";

const cartRoutes = Router();

cartRoutes.get("/", checkAuth, getCartData);
cartRoutes.post("/", checkAuth, updateCart);
cartRoutes.delete("/", checkAuth, removeFromCart);
cartRoutes.delete("/delete", checkAuth, clearCart);

export default cartRoutes;