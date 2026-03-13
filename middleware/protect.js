import jwt from "jsonwebtoken";
import User from "../Models/User.js";
import dotenv from "dotenv";
dotenv.config();

export const protect = async (req, res, next) => {
    const token = req?.cookies?.token;

    if (!token) {
        const error = new Error("Not authorized, no token");
        error.statusCode = 401;
        return next(error);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite:
                    process.env.NODE_ENV === "production"
                        ? "none"
                        : "strict",
            });

            const error = new Error("User not found");
            error.statusCode = 401;
            return next(error);
        }

        req.user = user;
        next();

    } catch (err) {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "strict",
        });

        const error = new Error("Token expired or invalid");
        error.statusCode = 401;
        return next(error);
    }
};

export const admin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        const error = new Error("Not authorized as admin");
        error.statusCode = 403;
        return next(error);
    }

    next();
};