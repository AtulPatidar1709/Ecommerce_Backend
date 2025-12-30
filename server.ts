import {app , httpServer } from "./src/app";
import { config } from "./src/config/config";
import connectDB from "./src/config/db";

const server = async () => {
  await connectDB();
  const port = config.port || 5513;
  httpServer.listen(port, () => {
    console.log("Listing to port ", port);
  })
}

server();
