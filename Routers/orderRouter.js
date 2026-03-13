// routes/order.js
import express from "express";
import { createBuyNowPaymentIntent, createOrder, createPaymentIntent, getAllOrders, getOrderById, getUserOrders, partialRefundOrder, placeCODOrder, refundOrder, stripeWebhook, updateCODStatus, updateOrderStatus } from "../Controllers/orderController.js";
import { admin, protect } from "../middleware/protect.js";

const orderRouter = express.Router();

orderRouter.post("/create", protect, createOrder);
orderRouter.get("/user-orders", protect, getUserOrders);
orderRouter.get("/all-orders", protect, admin, getAllOrders);
orderRouter.put("/update-status/:orderId", protect, admin, updateOrderStatus);
orderRouter.put("/update-cod/:orderId", protect, admin, updateCODStatus);
orderRouter.post("/cod", protect, placeCODOrder);
orderRouter.get("/:orderId", getOrderById);
orderRouter.post("/:id/refund", protect, admin, refundOrder)
orderRouter.post("/:id/partialRefund", protect, admin, partialRefundOrder)

orderRouter.post("/create-payment-intent", protect, createPaymentIntent);
orderRouter.post("/create-payment-intent-buy-now", protect, createBuyNowPaymentIntent);

// Stripe webhook endpoint
orderRouter.post("/webhook", stripeWebhook);


export default orderRouter;
