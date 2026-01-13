import { NextFunction, Request, Response } from "express";
import { Product } from "./productModel";
import createHttpError from "http-errors";
import cloudinary from "../config/cloudinary";
import { config } from "../config/config";
import { ProductType } from "./productTypes";
import { uploadFromBuffer } from "./helper";

const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const page = Number(req.query.page) || 1;

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

    const optimizeUrl = (url: string) => url.replace("/upload/", "/upload/f_auto,q_auto/");

    // Upload images to Cloudinary
    // Upload all product images in parallel
    const uploadedImages = await Promise.all(
      files.images.map(file =>
        uploadFromBuffer(file.buffer, "product-images", [{ quality: "auto", fetch_format: "auto" }])
          .then(optimizeUrl)
      )
    );

        // Upload thumbnail
    const thumbnailUrl = optimizeUrl(
      await uploadFromBuffer(
        files.thumbnail[0]!.buffer,
        "product-thumbnails",
        [{ width: 600, height: 600, crop: "fill" }]
      )
    );

    // Create product in database
    const product = await Product.create({
      title,
      description,
      price,
      stock,
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

// const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
//   try {
    
//     const { id } = req.body;

//     if (!id) {
//       return next(createHttpError(400, "Product Id missing."));
//     }

//     const product : ProductType | null = await Product.findById(id);

//     if(!product){
//       return next(createHttpError(404, "Product not exsist."));
//     }

//     console.log("Product in details ", product);

//     //https://res.cloudinary.com/dryapqold/image/upload/v1765172269/product-images/pctasqvj7stlcpvmc0jx.jpg

//     for (const image of product.images) {
//       const coverFileSplits = image.split("/");
//       const coverImagePublicId =
//           coverFileSplits.at(-2) +
//           "/" +
//           coverFileSplits.at(-1)?.split(".").at(-2);

//       console.log("coverImagePublicId", coverImagePublicId);
//       await cloudinary.uploader.destroy(coverImagePublicId);
//     }
    
//     const thumbnailSplits = product.thumbnail.split("/");
//     const thumbnailPublicId = thumbnailSplits.at(-2) + "/" + thumbnailSplits.at(-1)?.split(".").at(-2);
    
//     await cloudinary.uploader.destroy(thumbnailPublicId);

//     await Product.deleteOne({ _id: id });

//     return res.status(201).json({
//       message: "Deleted Successfully."
//     });

//   } catch (error) {
//     return next(createHttpError(400, "Something went wrong."));
//   }
// }

const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.body;

    if (!id) {
      return next(createHttpError(400, "Product Id missing."));
    }

    const product: ProductType | null = await Product.findById(id);

    if (!product) {
      return next(createHttpError(404, "Product does not exist."));
    }

    // Helper function to extract Public ID regardless of transformations
    // Works for: .../upload/f_auto,q_auto/v123/folder/image.jpg
    const getPublicId = (url: string) => {
      const parts = url.split('/');
      const folder = parts.at(-2); // e.g., 'product-images'
      const fileNameWithExt = parts.at(-1); // e.g., 'pctasqvj7stlcpvmc0jx.jpg'
      const publicId = fileNameWithExt?.split('.').at(0); // e.g., 'pctasqvj7stlcpvmc0jx'
      return `${folder}/${publicId}`;
    };

    // 1. Delete Gallery Images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map((image) => {
        const publicId = getPublicId(image);
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises); // Run deletions in parallel for speed
    }

    // 2. Delete Thumbnail from Cloudinary
    if (product.thumbnail) {
      const thumbnailPublicId = getPublicId(product.thumbnail);
      await cloudinary.uploader.destroy(thumbnailPublicId);
    }

    // 3. Delete from Database
    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Product and associated images deleted successfully."
    });

  } catch (error) {
    console.error("Delete Error:", error);
    return next(createHttpError(500, "Failed to delete product."));
  }
};

export { getAllProducts, getProductById, createProduct, deleteProduct };