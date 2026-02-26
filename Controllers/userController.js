import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
import User from '../Models/User.js';
import generateToken from "../utils/generateToken.js"

import dotenv from "dotenv";
dotenv.config();

export const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    //Check user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        //throw
        throw new Error("User already exists");
    }
    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isAdmin = email === process.env.ADMIN_EMAIL;
    //create the user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        isAdmin,
    });
    res.status(201).json({
        status: "success",
        message: "User Registered Successfully",
        data: user,
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    //Find the user in db by email only
    const user = await User.findOne({
        email,
    });

    if (user && (await bcrypt.compare(password, user?.password))) {
        generateToken(res, user._id);
        res.json({
            status: "success",
            message: "User logged in successfully",
            user,
        });
    } else {
        throw new Error("Invalid login credentials");
    }
});

export const profile = asyncHandler(async (req, res) => {


    const user = await User.findById(req.user._id)

    if (user) {
        res.json({
            status: "success",
            message: "User is here",
            user,
        });
    } else {
        throw new Error("no token or user");
    }


});

export const logout = asyncHandler(async (req, res) => {


    res.clearCookie('token').send({ message: "loggedOUT" });
    console.log("cookie destroyed")
});

export const checkAuth = asyncHandler(async (req, res) => {

    let token;
    token = req.cookies.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (user) {
        res.json({
            status: "success",
            message: "Token is OK",
            user,
        });
    } else {
        throw new Error("no token or user");
    }
}



);

export const updateShippingAddresctrl = asyncHandler(async (req, res) => {
    const {
        firstName,
        lastName,
        address,
        city,
        postalCode,
        province,
        phone,
        country,
    } = req.body;
    const user = await User.findByIdAndUpdate(
        req.user.id,
        {
            shippingAddress: {
                firstName,
                lastName,
                address,
                city,
                postalCode,
                province,
                phone,
                country,
            },
            hasShippingAddress: true,
        },
        {
            new: true,
        }
    );
    //send response
    res.json({
        status: "success",
        message: "User shipping address updated successfully",
        user,
    });
});



// @desc    Save/update user address
// @route   PUT /api/user/address
// @access  Private
export const saveUserAddress = asyncHandler(async (req, res) => {
    const { address } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.address = address;
    await user.save();

    res.status(200).json({ message: "Address saved successfully", address });
});


// GET logged-in user's address
export const getUserAddress = async (req, res) => {
    try {
        // protect middleware already sets req.user
        const user = await User.findById(req.user._id).select("address");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.status(200).json({
            address: user.address || "",
        });
    } catch (error) {
        console.error("Get User Address Error:", error);
        res.status(500).json({
            message: "Failed to fetch user address",
        });
    }
};



export const addToWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.wishlist.includes(productId)) {
        user.wishlist.push(productId);
        await user.save();
    }

    res.status(200).json({ message: "Added to wishlist" });
});

export const getUserWishlist = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.status(200).json(user.wishlist);
});


// REMOVE FROM WISHLIST
export const removeFromWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.wishlist = user.wishlist.filter(
        (id) => id.toString() !== productId.toString()
    );
    await user.save();

    res.status(200).json({ success: true, wishlist: user.wishlist });
});
