import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            trim: true,
            unique: true,
            uppercase: true,
            required: [true, "Name is required"],
            minlength: [6, "Too short"],
            maxlength: [12, "Too long"],
        },
        expiry: {
            type: Date,
            required: [true, "Expiry date is required"],
        },
        discount: {
            type: Number,
            required: [true, "Discount is required"],
        },
        usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
