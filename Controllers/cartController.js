
import Cart from "../Models/Cart.js";
import asyncHandler from "express-async-handler";

// controllers/cartController.js
export const saveUserCart = asyncHandler(async (req, res) => {
    const { products, cartTotal, totalAfterDiscount } = req.body;

    // 1. Remove existing cart if it exists
    await Cart.findOneAndDelete({ orderdBy: req.user._id });

    // 2. Create new cart
    const newCart = await Cart.create({
        products,
        cartTotal,
        totalAfterDiscount,
        orderdBy: req.user._id,
    });

    res.status(201).json(newCart);
});


// GET /api/cart
export const getUserCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const cart = await Cart.findOne({ orderdBy: userId })
        .populate("products.product", "title price _id totalAfterDiscount") // specify the fields you want from Product
        .exec();

    if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json(cart);
});


// PUT /api/cart/empty
export const emptyCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const cart = await Cart.findOneAndUpdate(
        { orderdBy: userId },
        {
            products: [],
            cartTotal: 0,
            totalAfterDiscount: 0,
        },
        { new: true }
    );

    if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json({ message: "Cart emptied successfully", cart });
});
