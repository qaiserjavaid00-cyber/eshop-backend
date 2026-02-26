import asyncHandler from "express-async-handler";
import Variant from "../Models/Variant.js";


// @desc    Get all variants for a product
// @route   GET /api/variants/:productId
// @access  Public (or Private if you want auth)
export const getVariantsByProductId = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        res.status(400);
        throw new Error("Product ID is required");
    }

    // Fetch all variants for this product
    const variants = await Variant.find({ productId });

    res.status(200).json(variants);
});


/**
 * @desc    Delete a single variant by ID
 * @route   DELETE /api/variants/:id
 * @access  Private/Admin
 */
export const deleteVariant = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const variant = await Variant.findById(id);
    if (!variant) {
        res.status(404);
        throw new Error("Variant not found");
    }

    await variant.deleteOne();

    res.status(200).json({
        success: true,
        message: "Variant deleted successfully",
        variantId: id,
    });
});