// routes/cart.js
import express from "express";

import { createPaymentIntent } from "../Controllers/stripeController.js";
import { protect } from "../middleware/protect.js";




const stripeRouter = express.Router();

stripeRouter.post("/create-payment-intent", protect, createPaymentIntent);


export default stripeRouter;
