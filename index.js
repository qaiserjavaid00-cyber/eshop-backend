import dotenv from 'dotenv';
import { connectDB } from './db/connectDB.js';

import express from "express"
import cookieParser from 'cookie-parser';
import cors from "cors"
import morgan from 'morgan';
import { globalErrhandler, notFound } from './middleware/globalErrorHandler.js';

import userRouter from './Routers/userRouter.js';
import catRouter from './Routers/categoryRouter.js';
import subRouter from './Routers/subRouter.js';
import productRouter from './Routers/productRouter.js';
import cartRouter from './Routers/cartRouter.js';
import couponRouter from './Routers/couponRouter.js';
import stripeRouter from './Routers/stripeRouter.js';
import orderRouter from './Routers/orderRouter.js';
import variantRouter from './Routers/variantRouter.js';
import statsRouter from './Routers/statsRouter.js';
import heroRouter from './Routers/heroRouter.js';

dotenv.config();
connectDB();

const app = express();


// ---------- Stripe Webhook Route (RAW Body Required) ----------
app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/order/webhook")) {
        // ✅ give Stripe raw body
        return express.raw({ type: "application/json" })(req, res, next);
    }
    express.json()(req, res, next);
});

///middlewares////////
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const corsOptions = {
    origin: ["https://eshop-frontend-69ze.vercel.app/"],
    credentials: true,
};
app.use(cors(corsOptions));

////Routers//////

app.use("/user", userRouter);
app.use("/product", productRouter);
app.use("/category", catRouter)
app.use("/sub", subRouter)
app.use("/cart", cartRouter)
app.use("/coupon", couponRouter)
app.use("/api/stripe", stripeRouter)
app.use("/order", orderRouter)
app.use("/variant", variantRouter)
app.use("/stats", statsRouter)
app.use("/hero", heroRouter)
// app.use("/review", revieouter)

app.use(notFound)
app.use(globalErrhandler)

app.listen(process.env.PORT, console.log(`Server is up and running on port ${process.env.PORT}`));
