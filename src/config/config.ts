import { config as conf } from "dotenv";

conf();

const _config = {
  port: process.env.PORT,
  data_base_url: process.env.DATA_BASE_URL,
  enviroment: process.env.NODE_ENV,
  cookie_secret: process.env.COOKIE_SECRET,
  googel_client_id: process.env.GOOGLE_CLIENT_ID,
  frontendDomain: process.env.FRONT_END_DOMAIN,
  buildDomain: process.env.BUILD_DOMAIN,
  cloudinaryCloud: process.env.CLOUDINARY_CLOUD,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinarySecret: process.env.CLOUDINARY_API_SECRET,
  products_per_page: process.env.PRODUCT_PER_PAGE,  
  RZP_TEST_API_KEY: process.env.RZP_TEST_API_KEY,
  RZP_TEST_KEY_SECRET: process.env.RZP_TEST_KEY_SECRET,
  MAIL_SECRET_KEY : process.env.MAIL_PASSKEY,
  MAIL_ADDRESS_KEY : process.env.MAIL_ADDRESS,
  RZP_TEST_KEY_WEBHOOK_SECRET : process.env.RZP_TEST_KEY_WEBHOOK_SECRET,
  OPENAI_API_KEY : process.env.OPENAI_API_KEY,
  JWT_SECRET : process.env.JWT_SECRET,
}

export const config = Object.freeze(_config);