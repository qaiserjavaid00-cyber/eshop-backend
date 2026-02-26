// routes/cart.js
import express from "express";

import { admin, protect } from "../middleware/protect.js";
import { applyCouponToBuyNow, applyCouponToCart, createCoupon, deleteCoupon, getAllCoupons } from "../Controllers/couponController.js";


const couponRouter = express.Router();

couponRouter.post("/create", protect, admin, createCoupon); // optional: add admin protect

couponRouter.delete("/:couponId", protect, admin, deleteCoupon);
couponRouter.get("/", protect, getAllCoupons);

// ✅ Only authenticated users can apply a coupon to their cart
couponRouter.post("/apply", protect, applyCouponToCart);
couponRouter.post("/apply-buy-now", protect, applyCouponToBuyNow);
export default couponRouter;
