import checkAuth from '../middlewares/authMiddleware';
import { createAddress, deleteAddress, getAddressesById, getAllAddresses } from './addressCantroller';
import { Router } from "express";

const addressRoutes = Router();

addressRoutes.get("/", checkAuth, getAllAddresses);
addressRoutes.get("/:id",checkAuth, getAddressesById);

//Admin Only Routes.
addressRoutes.post("/create", checkAuth, createAddress);
addressRoutes.delete("/delete", checkAuth, deleteAddress);

export default addressRoutes;