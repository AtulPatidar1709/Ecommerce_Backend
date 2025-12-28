import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/config';
import userRouter from './user/userRoutes';
import ErrorHandlerMiddleWare from './middlewares/ErrorHandlerMiddleWare';

//Routes
import cartRoutes from './cart/cartRoutes';
import optRoutes from './user/otp/otpRoutes';
import ordersRoutes from './orders/orderRoutes';
import sessionRoutes from './session/sessionRoutes';
import productRoutes from './product/productRoutes';
import addressRoutes from './address/addressRoutes';
import paymentRoutes from './payment/paymentRoutes';

const app = express();

app.use('/api/payment/payment-verify', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use(
    cors({
        origin: config.frontendDomain,
        credentials: true,
    })
);

app.use(cookieParser(config.cookie_secret));

app.get("/", (req, res, next) => {
  res.json({ message: "Welcome to elib apis" });
});

app.use("/api/users", userRouter);
app.use("/api/otp", optRoutes);
app.use("/api/products", productRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);

app.use(ErrorHandlerMiddleWare);

export default app;