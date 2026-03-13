import About from "../Models/About.js";
import asyncHandler from "express-async-handler";

export const updateAbout = asyncHandler(async (req, res) => {
    const { title, description, mission, vision, isActive } = req.body;

    // Find existing About doc (singleton)
    let about = await About.findOne({});

    if (!about) {
        about = new About();
    }

    // Update text fields if provided
    if (title !== undefined) about.title = title;
    if (description !== undefined) about.description = description;
    if (mission !== undefined) about.mission = mission;
    if (vision !== undefined) about.vision = vision;
    if (isActive !== undefined) about.isActive = isActive;

    // If video uploaded
    if (req.file) {
        about.video = {
            url: req.file.path,
            public_id: req.file.filename,
        };
    }

    const updatedAbout = await about.save();

    res.json(updatedAbout);
});



// controllers/aboutController.js

export const getAbout = asyncHandler(async (req, res) => {
    const about = await About.findOne({});

    if (!about) {
        return res.json({
            title: "",
            description: "",
            mission: "",
            vision: "",
            video: {},
            isActive: true,
        });
    }

    res.json(about);
});