import mongoose from "mongoose";

const heroSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        subtitle: {
            type: String,
            required: true,
        },
        image: {
            public_id: String,
            url: String,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        order: {
            type: Number,
            default: 0, // for slider ordering
        },
    },
    { timestamps: true }
);

export default mongoose.model("Hero", heroSchema);