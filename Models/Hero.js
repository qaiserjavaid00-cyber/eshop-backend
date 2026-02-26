// models/Hero.js
import mongoose from "mongoose";

const heroSchema = new mongoose.Schema(
    {
        title: { type: String, default: "Upgrade Your Tech Today" },
        subtitle: {
            type: String,
            default:
                "Discover premium tech products with great deals, dependable delivery, and easy returns.",
        },
        image: {
            public_id: String,
            url: String,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Hero", heroSchema);