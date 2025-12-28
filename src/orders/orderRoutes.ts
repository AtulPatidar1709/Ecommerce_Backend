import { Router } from "express";
import checkAuth from "../middlewares/authMiddleware";
import { cancelOrder, createOrder, getAllOrders, getAllOrdersForAllUsers, updateOrder, updateUserOrderStatus } from "./orderController";

import isAdmin from "../middlewares/isAdmin";

const ordersRoutes = Router();

ordersRoutes.get("/", checkAuth, getAllOrders);
ordersRoutes.post("/cancel-order", checkAuth, cancelOrder);
ordersRoutes.post("/update-address", checkAuth, updateOrder);
ordersRoutes.post("/create-order", checkAuth, createOrder);


//Admin Only Routes 

//get all orders
ordersRoutes.get("/all-orders", checkAuth, isAdmin, getAllOrdersForAllUsers);

//get Updated Order
ordersRoutes.post("/update-order", checkAuth, isAdmin, updateUserOrderStatus);

export default ordersRoutes;  