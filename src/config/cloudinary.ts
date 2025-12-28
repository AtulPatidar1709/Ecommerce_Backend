import { v2 as cloudinary } from "cloudinary";
import { config } from "./config";


if (!config.cloudinaryCloud || !config.cloudinaryApiKey || !config.cloudinarySecret) {
  throw new Error("Cloudinary config is missing!");
}

cloudinary.config({
  cloud_name: config.cloudinaryCloud,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinarySecret,
});

export default cloudinary;
