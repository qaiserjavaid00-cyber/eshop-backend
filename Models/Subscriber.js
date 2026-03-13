import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        source: {
            type: String,
            default: "website", // footer, popup, checkout
        },
    },
    { timestamps: true }
);

export default mongoose.model("Subscriber", subscriberSchema);