import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        products: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
                variant: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", default: null, },
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
                refundedQty: {
                    type: Number,
                    default: 0,
                },

                pendingRefundQty: {
                    type: Number,
                    default: 0,
                },
            },
        ],

        paymentIntent: {
            id: String,
            amount: Number,
            currency: String,
            status: String,
            created: Number,
        },
        appliedCoupon: {
            code: String,
            discount: Number,
        },

        paymentIntentId: String, // ✅ needed

        address: String,

        orderdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        orderStatus: {
            type: String,
            default: "Processing",
            enum: ["Processing", "Shipped", "Delivered", "Cancelled", "Refund Initiated", "Refunded", "Partially Refunded"],
        },
        amountPaid: Number,

        isPaid: {
            type: Boolean,
            default: false,
        },

        paidAt: Date, // ✅ needed
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;