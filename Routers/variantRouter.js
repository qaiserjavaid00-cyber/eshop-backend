import express from "express";
import { deleteVariant, getVariantsByProductId } from "../Controllers/variantController.js";

const variantRouter = express.Router();

// GET /api/variants/:productId
variantRouter.get("/:productId", getVariantsByProductId);
variantRouter.delete("/del/:id", deleteVariant);

export default variantRouter;
