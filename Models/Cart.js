import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
    {
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },

                variant: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Variant",
                    default: null,
                },

                size: {
                    type: String,
                    default: null,
                },

                color: {
                    type: String,
                    default: null,
                },

                price: {
                    type: Number,
                    required: true,
                },

                count: {
                    type: Number,
                    required: true,
                    min: 1,
                },
            },
        ],

        cartTotal: Number,
        totalAfterDiscount: Number,

        appliedCoupon: {
            code: String,
            discount: Number,
        },

        orderdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
