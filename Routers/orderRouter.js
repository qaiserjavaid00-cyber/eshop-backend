// routes/order.js
import express from "express";
import { createBuyNowPaymentIntent, createCODOrder, createOrder, createPaymentIntent, getAllOrders, getOrderById, getUserOrders, partialRefundOrder, refundOrder, stripeWebhook, updateOrderStatus } from "../Controllers/orderController.js";
import { admin, protect } from "../middleware/protect.js";

const orderRouter = express.Router();

orderRouter.post("/create", protect, createOrder);
orderRouter.get("/user-orders", protect, getUserOrders);
orderRouter.get("/all-orders", protect, admin, getAllOrders);
orderRouter.put("/update-status/:orderId", protect, admin, updateOrderStatus);
orderRouter.post("/cod", protect, createCODOrder);
orderRouter.get("/:orderId", getOrderById);
orderRouter.post("/:id/refund", protect, admin, refundOrder)
orderRouter.post("/:id/partialRefund", protect, admin, partialRefundOrder)

orderRouter.post("/create-payment-intent", protect, createPaymentIntent);
orderRouter.post("/create-payment-intent-buy-now", protect, createBuyNowPaymentIntent);

// Stripe webhook endpoint
orderRouter.post("/webhook", stripeWebhook);


export default orderRouter;
