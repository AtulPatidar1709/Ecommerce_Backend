
import cors from 'cors';
import express, { Request, Response } from 'express';
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
import helmet from 'helmet';

const app = express();
const server = createServer(app);

app.use(helmet({
    contentSecurityPolicy : {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", '"https://images.unsplash.com/"', "https://res.cloudinary.com", "https://accounts.google.com", "data:"],
          scriptSrc: [
              "'self'", 
              "https://checkout.razorpay.com", 
              "https://apis.google.com", 
              "https://accounts.google.com"
            ],
          styleSrc: ["'self'", "'unsafe-inline'", "'https://fonts.googleapis.com'"],
          connectSrc: ["'self'", "http://localhost:5513", "ws:", "wss:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
          reportUri: ['http://localhost:5513/csp-violation-report-endpoint'],
        }
    }
}));

// Handling for RazorPay/Payment webhook.
app.use('/api/payment/payment-verify', express.raw({ type: 'application/json' }));

app.use(express.json({
  type: ['application/json', 'application/csp-report']
}));

const cspReportHandler = (req: Request, res: Response) => {
  console.warn('⚠️ CSP Violation Detected');
  console.warn(JSON.stringify(req.body, null, 2));
  res.status(204).end();
};

// 1. Core Security & Optimization (Top Level)
app.use(compression())
app.use( cors({
        origin: [config.frontendDomain!, config.buildDomain!],
        credentials: true,
}));

// 2. Cookie & Body Parsing.
app.use(cookieParser(config.cookie_secret));

app.use(express.json());

// 3. Socket.io Setup for Chat Bot
const io = new Server(server, {
    cors: {
        origin: config.buildDomain,
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next);

io.use(wrap(cookieParser(config.cookie_secret)));

io.use(authSocket);

io.on('connection', (socket : any) => {
    console.log(`User connected: ${socket.userId}`);   
});

app.post('/csp-violation-report-endpoint', cspReportHandler);

app.get('/test-csp', (req, res) => {
  res.send(`
    <img src="https://res.cloudinary.com/demo/image/upload/sample.jpg" />
  `);
});

// API Routes
app.use("/", sitemapRoute);
app.use("/api/users", userRouter);
app.use("/api/otp", optRoutes);
app.use("/api/products", productRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/bot', botRoutes(io));

// //Static Files & Frontend Fallback (MUST be after API routes)
// const distPath = path.resolve(__dirname, "../../User/dist");
// app.use(express.static(distPath, { maxAge: "1y" }));

// //Vite UI showing nothing on refresh
// app.get("*all", (req, res) => {
//     res.sendFile(path.join(distPath, "index.html"));
// });

app.use(ErrorHandlerMiddleWare);

export { app, server as httpServer };