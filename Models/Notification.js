import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
        priority: {
            type: Number,
            default: 0, // Higher number = shows first
        },
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);