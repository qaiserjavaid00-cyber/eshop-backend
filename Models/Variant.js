import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        size: { type: String, required: true, trim: true },
        color: { type: String, required: true, trim: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 0 },
        sold: { type: Number, default: 0 },

        // Variant-specific images
        images: { type: [String], default: [] },

        // Flash deal
        isFlashDeal: { type: Boolean, default: false },
        salePrice: { type: Number, default: null },
        saleStart: { type: Date, default: null },
        saleEnd: { type: Date, default: null },

        // Regular sale
        isOnSale: { type: Boolean, default: false },
        regularSalePrice: { type: Number, default: null },
        specifications: [
            { key: String, value: String }
        ],
        tags: [
            { type: String }
        ],

    },

    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: calculate current final price
variantSchema.virtual("finalPrice").get(function () {
    const now = new Date();
    if (this.isFlashDeal && this.salePrice && this.saleStart && this.saleEnd && now >= this.saleStart && now <= this.saleEnd) {
        return this.salePrice;
    }
    if (this.isOnSale && this.regularSalePrice) return this.regularSalePrice;
    return this.price;
});

const Variant = mongoose.model("Variant", variantSchema);
export default Variant;
