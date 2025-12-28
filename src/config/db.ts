import mongoose from "mongoose";
import { config } from "./config";
import { error } from "console";

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => {
      console.log("Connected Successfully.")
    });

    mongoose.connection.on('error', () => console.log("Error in Connecting to database. ", error))
    await mongoose.connect(config.data_base_url as string);

  } catch (error) {
    console.error('Failed to connect to database. ', error);
    process.exit(1);
  }
}

export default connectDB;