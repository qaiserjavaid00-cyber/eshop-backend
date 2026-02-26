
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 100 },
        slug: { type: String, unique: true, lowercase: true, index: true },
        description: { type: String, required: true, maxlength: 2000 },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
        sub: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Sub" }
        ],
        brand: { type: String, enum: ["Apple", "Samsung", "Microsoft", "Lenovo", "ASUS", "Hp"] },
        shipping: { type: String, enum: ["Yes", "No"] },
        ratings: [
            { star: Number, postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } },
        ],
        stock: { type: Number, min: 0, default: null },
        basePrice: { type: Number, min: 0, default: null },
        hasVariant: { type: Boolean, default: false },
        sold: { type: Number, default: 0 },
        images: {
            type: [String],
            default: [],
        },
        isFeatured: {
            type: Boolean,
            default: false,
            index: true
        },
        specifications: [
            {
                key: String,
                value: String
            }
        ],
        tags: [
            {
                type: String,
                index: true
            }
        ]

    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
