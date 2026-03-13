import { Router } from "express";
import { addToWishlist, checkAuth, getProfile, getUserAddress, getUserStats, getUserWishlist, login, logout, register, removeFromWishlist, saveUserAddress, updateProfile, updateProfilePicture } from "../Controllers/userController.js";
import { protect } from "../middleware/protect.js";
import { loginSchema, registerSchema } from "../validators/authSchema.js";
import { validate } from "../middleware/validate.js";
import fileupload from "../db/fileupload.js";

const userRouter = Router();
userRouter.get("/checkAuth", protect, checkAuth);
userRouter.get("/stats", protect, getUserStats);
userRouter.get("/addresses", protect, getUserAddress);
userRouter.post("/register", validate(registerSchema), register);
userRouter.post("/login", validate(loginSchema), login);
userRouter.post("/logout", logout);
userRouter.put("/address", protect, saveUserAddress);
userRouter.get("/wishlist", protect, getUserWishlist);
userRouter.put("/wishlist", protect, addToWishlist);
userRouter.delete("/wishlist/:productId", protect, removeFromWishlist);

userRouter.get("/profile", protect, getProfile);

userRouter.put("/profile", protect, updateProfile);

userRouter.put(
    "/profile/picture",
    protect,
    fileupload.single("profilePic"),
    updateProfilePicture
);

export default userRouter;