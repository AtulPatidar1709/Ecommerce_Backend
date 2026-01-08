import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/config';
import userRouter from './user/userRoutes';
import ErrorHandlerMiddleWare from './middlewares/ErrorHandlerMiddleWare';
import compression from 'compression';
import sitemapRoute from "./routes/sitemap";
// Chat Bot - Imports
import { Server } from 'socket.io';
import { createServer } from 'http';

//Routes
import cartRoutes from './cart/cartRoutes';
import optRoutes from './user/otp/otpRoutes';
import ordersRoutes from './orders/orderRoutes';
import sessionRoutes from './session/sessionRoutes';
import productRoutes from './product/productRoutes';
import addressRoutes from './address/addressRoutes';
import paymentRoutes from './payment/paymentRoutes';
import { authSocket } from './middlewares/authMiddleware';
import botRoutes from './chatBot/botRoutes';

const app = express();
const server = createServer(app);

app.use(cookieParser(config.cookie_secret));

const io = new Server(server, {
    cors: {
        origin: config.buildDomain,
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

app.use(express.static("dist", { maxAge: "1y" }));
app.use(compression())

const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next);

io.use(wrap(cookieParser(config.cookie_secret)));

// Socket Authentication Middleware
io.use(authSocket);

io.on('connection', (socket : any) => {
    console.log(`User connected: ${socket.userId}`);   
});

app.use(
    cors({
        origin: [config.frontendDomain!, config.buildDomain!],
        credentials: true,
    })
);

app.use('/api/payment/payment-verify', express.raw({ type: 'application/json' }));

app.use("/", sitemapRoute);
app.use(express.json());

app.get("/", (req, res, next) => {
  res.json({ message: "Welcome to elib apis" });
});

app.get('/', (_, res) => res.json({ message: 'Welcome to elib apis' }));
app.use("/api/users", userRouter);
app.use("/api/otp", optRoutes);
app.use("/api/products", productRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);

app.use('/api/bot', botRoutes(io));

app.use(ErrorHandlerMiddleWare);

export { app, server as httpServer };