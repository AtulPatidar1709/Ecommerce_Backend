import { NextFunction, Request, Response } from "express";
import { Product } from "./productModel";
import createHttpError from "http-errors";
import path from "path";
import cloudinary from "../config/cloudinary";
import fs from "node:fs";
import { config } from "../config/config";
import { ProductType } from "./productTypes";

const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const page = Number(req.query.page) || 1;

    console.log("Query ", page);

    const Product_Limit: number = Number(config.products_per_page) || 5;
    
    const total = (page - 1 || 0) * Product_Limit;

    const data = await Product.find({}).skip(total).limit(Product_Limit);

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / Number(Product_Limit));

    const isLastPage = Number(page) === totalPages;
    const isFirstPage = Number(page) === 1;
    
    return res.status(200).json({
      products: data,
      pagination: {
        totalPages,
        first: isFirstPage,
        last: isLastPage,
      },
    })

  } catch (error) {
    return next(createHttpError(400, "Something went wrong."));
  }
}

const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(createHttpError(400, "Something went wrong."));
    }

    const product : ProductType | null = await Product.findById(id);

    if (!product) {
      return next(createHttpError(400, "product not found."));
    }

    return res.status(200).json({
      product
    });

  } catch (error) {
    return next(createHttpError(400, "Something went wrong."));
  }
}

const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, stock, price, discount } = req.body;

    if (!title || !description || !stock || !discount || !price) {
      return next(createHttpError(400, "Missing required fields"));
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files.images || files.images.length < 4 || !files.thumbnail || files.thumbnail.length !== 1) {
      return next(createHttpError(400, "Images or thumbnail missing or invalid"));
    }

    // Upload images to Cloudinary
    const uploadedImages: string[] = [];
    for (const file of files.images) {
      const filePath = path.resolve(__dirname, "../../public/data/uploads", file.filename);
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "product-images",
      });
      uploadedImages.push(result.secure_url);
      await fs.promises.unlink(filePath);
    }

    //upload Thumbnail
    const thumbnailFile = files.thumbnail[0];
    if(thumbnailFile === undefined) {
      return next(createHttpError(301, "Please Provide Thumbnail"));
    }
    
    const thumbnailPath = path.resolve(__dirname, "../../public/data/uploads", thumbnailFile?.filename);
    const thumbnailUpload = await cloudinary.uploader.upload(thumbnailPath, {
      folder: "product-thumbnails",
    });
    
    const thumbnailUrl = thumbnailUpload.secure_url;

    // Delete local thumbnail
    await fs.promises.unlink(thumbnailPath);

    // Create product in database
    const product = await Product.create({
      title,
      description,
      stock,
      price,
      discount,
      images: uploadedImages,
      thumbnail: thumbnailUrl,
    });

    return res.status(200).json({
      productId: product._id,
      message: "Product created successfully",
    });

  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Something went wrong"));
  }
};

const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const { id } = req.body;

    if (!id) {
      return next(createHttpError(400, "Product Id missing."));
    }

    const product : ProductType | null = await Product.findById(id);

    if(!product){
      return next(createHttpError(404, "Product not exsist."));
    }

    console.log("Product in details ", product);

    //https://res.cloudinary.com/dryapqold/image/upload/v1765172269/product-images/pctasqvj7stlcpvmc0jx.jpg

    for (const image of product.images) {
      const coverFileSplits = image.split("/");
      const coverImagePublicId =
          coverFileSplits.at(-2) +
          "/" +
          coverFileSplits.at(-1)?.split(".").at(-2);

      console.log("coverImagePublicId", coverImagePublicId);
      await cloudinary.uploader.destroy(coverImagePublicId);
    }
    
    const thumbnailSplits = product.thumbnail.split("/");
    const thumbnailPublicId = thumbnailSplits.at(-2) + "/" + thumbnailSplits.at(-1)?.split(".").at(-2);
    
    await cloudinary.uploader.destroy(thumbnailPublicId);

    await Product.deleteOne({ _id: id });

    return res.status(201).json({
      message: "Deleted Successfully."
    });

  } catch (error) {
    return next(createHttpError(400, "Something went wrong."));
  }
}

export { getAllProducts, getProductById, createProduct, deleteProduct };