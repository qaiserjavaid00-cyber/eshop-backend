import { Router } from "express";

import { admin, protect } from "../middleware/protect.js";
import { create, deleteProduct, getFeaturedProducts, getFilters, getFlashProducts, getProduct, getProductBySlug, getProducts, getSaleProducts, listProducts, rateProduct, updateProduct, } from "../Controllers/productController.js";
import fileupload from "../db/fileupload.js";
import { validate } from "../middleware/validate.js";
import { createProductSchema, updateProductSchema } from "../validators/productSchema.js";
import { mongoIdSchema } from "../validators/mongoIdSchema.js";


const productRouter = Router();

productRouter.post("/create", protect, admin, fileupload.any(), validate(createProductSchema), create);
productRouter.get("/list", listProducts);
productRouter.get("/filters", getFilters);
productRouter.get("/featured", getFeaturedProducts);
productRouter.get("/flash", getFlashProducts);
productRouter.get("/sales", getSaleProducts);
productRouter.get("/products", getProducts);
productRouter.get("/product/:id", validate(mongoIdSchema, "params"), getProduct);
productRouter.get("/:slug", getProductBySlug);
productRouter.put("/star", protect, rateProduct);
productRouter.delete("/:id", protect, admin, validate(mongoIdSchema, "params"), deleteProduct);
productRouter.put("/update/:id", protect, admin, validate(mongoIdSchema, "params"), fileupload.any(), validate(updateProductSchema), updateProduct);

export default productRouter;