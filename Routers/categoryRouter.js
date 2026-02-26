import { Router } from "express";

import { admin, protect } from "../middleware/protect.js";
import { create, list, deleteCategory, singleCatById } from "../Controllers/categoryController.js";
// import catUpload from "../db/catFileUpload.js";


const catRouter = Router();

catRouter.post("/create", protect, admin, create);
catRouter.get("/list", list);
catRouter.get("/:id", singleCatById);
// catRouter.put("/update/:id", update);
catRouter.delete("/:id", deleteCategory);
// catRouter.post("/logout", logout);
// productRouter.get("/profile", protect, profile);
// productRouter.get("/auth", checkAuth);

export default catRouter;