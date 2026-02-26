import { Router } from "express";
import { addToWishlist, checkAuth, getUserAddress, getUserWishlist, login, logout, register, removeFromWishlist, saveUserAddress } from "../Controllers/userController.js";
import { protect } from "../middleware/protect.js";
import { loginSchema, registerSchema } from "../validators/authSchema.js";
import { validate } from "../middleware/validate.js";

const userRouter = Router();
userRouter.get("/addresses", protect, getUserAddress);
userRouter.post("/register", validate(registerSchema), register);
userRouter.post("/login", validate(loginSchema), login);
userRouter.post("/logout", logout);
userRouter.put("/address", protect, saveUserAddress);
// userRouter.get("/profile", protect, profile);
userRouter.get("/auth", checkAuth);
// userRouter.put("/update/shipping", protect, updateShippingAddresctrl);
userRouter.get("/wishlist", protect, getUserWishlist);
userRouter.put("/wishlist", protect, addToWishlist);
userRouter.delete("/wishlist/:productId", protect, removeFromWishlist);

export default userRouter;