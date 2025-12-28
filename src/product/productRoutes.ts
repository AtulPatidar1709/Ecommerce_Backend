import express from 'express'
import { createProduct, deleteProduct, getAllProducts, getProductById } from './productController';
import checkAuth from '../middlewares/authMiddleware';
import isAdmin from '../middlewares/isAdmin';
import { uploadFields } from '../middlewares/multerFiles';

const productRoutes = express.Router();

productRoutes.get("/", getAllProducts);
productRoutes.get("/:id", getProductById);

//Admin Only Routes.
productRoutes.post("/create", checkAuth, isAdmin, uploadFields, createProduct);
productRoutes.delete("/delete", checkAuth, isAdmin, deleteProduct);

export default productRoutes;