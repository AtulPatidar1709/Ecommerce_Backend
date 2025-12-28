import app from "./src/app";
import { config } from "./src/config/config";
import connectDB from "./src/config/db";

const server = async () => {
  await connectDB();
  const port = config.port || 3000;
  app.listen(port, () => {
    console.log("Listing to port ", port);
  })
}

server();

//AutoCanon for load testing
// Mutax for handle async operation to protect or use best practices like {$inc } in mongo