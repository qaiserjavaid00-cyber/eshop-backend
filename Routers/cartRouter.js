// routes/cart.js
import express from "express";
import { emptyCart, getUserCart, saveUserCart } from "../Controllers/cartController.js";
import { protect } from "../middleware/protect.js";


const cartRouter = express.Router();

cartRouter.post("/create", protect, saveUserCart); // attach user from token
cartRouter.get("/mycart", protect, getUserCart);
cartRouter.put("/empty", protect, emptyCart);
export default cartRouter;
