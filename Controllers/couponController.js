import asyncHandler from "express-async-handler";
import Coupon from "../Models/Coupon.js";
import Cart from "../Models/Cart.js";
import Product from "../Models/Product.js";
import Variant from "../Models/Variant.js";

// @desc    Create a new coupon
// @route   POST /api/coupons/create
// @access  Admin (add auth if needed)
export const createCoupon = asyncHandler(async (req, res) => {
    const { code, expiry, discount } = req.body;

    const existing = await Coupon.findOne({ code });
    if (existing) {
        res.status(400);
        throw new Error("Coupon already exists");
    }

    const coupon = await Coupon.create({ code, expiry, discount });
    res.status(201).json(coupon);
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Admin
export const getAllCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:couponId
// @access  Admin
export const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.couponId);

    if (!coupon) {
        res.status(404);
        throw new Error("Coupon not found");
    }

    await coupon.deleteOne();
    res.json({ message: "Coupon deleted successfully" });
});



// @desc    Apply coupon and update user's cart with totalAfterDiscount
// @route   POST /api/coupons/apply
// @access  Private
export const applyCouponToCart = asyncHandler(async (req, res) => {
    const { coupon } = req.body;
    const userId = req.user._id;

    // 1. Find coupon
    const validCoupon = await Coupon.findOne({ code: coupon.toUpperCase() });
    if (!validCoupon) {
        res.status(400);
        throw new Error("Invalid coupon");
    }

    if (validCoupon.usedBy.includes(userId)) {
        return res.status(400).json({ message: "Coupon already used" });
    }

    if (new Date(validCoupon.expiry) < new Date()) {
        res.status(400);
        throw new Error("Coupon has expired");
    }

    // 2. Get user's cart
    const userCart = await Cart.findOne({ orderdBy: userId });
    if (!userCart) {
        res.status(404);
        throw new Error("Cart not found");
    }

    // 3. Calculate discount
    const discountPercent = validCoupon.discount;
    const discountAmount = (userCart.cartTotal * discountPercent) / 100;
    const totalAfterDiscount = (userCart.cartTotal - discountAmount).toFixed(2);

    // 4. Update cart
    userCart.totalAfterDiscount = totalAfterDiscount;

    userCart.appliedCoupon = {
        code: validCoupon.code,
        discount: validCoupon.discount,
    };

    await userCart.save();

    res.json({
        cartTotal: userCart.cartTotal,
        discount: discountPercent,
        totalAfterDiscount: userCart.totalAfterDiscount,
    });
});



/////buy-now

export const applyCouponToBuyNow = asyncHandler(async (req, res) => {
    const { couponCode, productId, variantId, quantity } = req.body;
    const userId = req.user._id;
    if (!couponCode) {
        res.status(400);
        throw new Error("Coupon code is required");
    }

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) throw new Error("Invalid coupon");

    // ✅ CHECK IF ALREADY USED
    if (coupon.usedBy.includes(userId)) {
        return res.status(400).json({ message: "Coupon already used" });
    }

    // ✅ CHECK EXPIRY
    if (new Date(coupon.expiry) < new Date()) {
        throw new Error("Coupon has expired");
    }

    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    let price = product.basePrice;

    if (variantId) {
        const variant = await Variant.findById(variantId);
        if (!variant) throw new Error("Variant not found");
        price = variant.finalPrice;
    }

    const total = price * quantity;
    const discountAmount = (total * coupon.discount) / 100;
    const finalAmount = total - discountAmount;

    res.json({
        total,
        discount: coupon.discount,
        finalAmount,
    });
});