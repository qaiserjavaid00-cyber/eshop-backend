import jwt from "jsonwebtoken";
import User from "../Models/User.js";

export const protect = async (req, res, next) => {
    let token;
    token = req?.cookies?.token;
    console.log(token)
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decoded)
            req.user = await User.findById(decoded?.id).select('-password')
            console.log(req.user.id)
            next();
        } catch (error) {
            res.status(400);
            res.json({
                message: error,
            });
        }
    }
    else {
        res.status(400);
        res.json({
            message: "invalid token"
        });

    }
}

export const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    }
    else {
        res.status(400);
        res.json({
            message: "not an admin"
        });

    }

}
