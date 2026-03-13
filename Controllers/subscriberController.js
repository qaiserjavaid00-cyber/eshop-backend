import asyncHandler from "express-async-handler";
import Subscriber from "../Models/Subscriber.js";

export const subscribe = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error("Email is required");
    }

    const existing = await Subscriber.findOne({ email });

    if (existing) {
        if (!existing.isActive) {
            existing.isActive = true;
            await existing.save();
            return res.json({ message: "Subscribed again successfully" });
        }

        res.status(400);
        throw new Error("Already subscribed");
    }

    await Subscriber.create({ email });

    res.status(201).json({ message: "Subscribed successfully" });
});