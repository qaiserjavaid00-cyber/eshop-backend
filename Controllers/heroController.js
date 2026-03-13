// controllers/heroController.js

import Hero from "../Models/Hero.js";
import asyncHandler from "express-async-handler";
import cloudinaryPackage from "cloudinary";

const cloudinary = cloudinaryPackage.v2;

const getHero = asyncHandler(async (req, res) => {
    const hero = await Hero.findOne();
    res.status(200).json(hero);
});


export const createHero = asyncHandler(async (req, res) => {
    const heroImage = req.files?.find(
        (file) => file.fieldname === "heroImage"
    );

    if (!heroImage) {
        return res.status(400).json({ message: "Hero image required" });
    }

    const hero = await Hero.create({
        title: req.body.title,
        subtitle: req.body.subtitle,
        image: {
            public_id: heroImage.filename,
            url: heroImage.path,
        },
        order: req.body.order || 0,
    });

    res.status(201).json(hero);
});

export const updateHero = asyncHandler(async (req, res) => {
    const hero = await Hero.findById(req.params.id);

    if (!hero) {
        return res.status(404).json({ message: "Hero not found" });
    }

    const heroImage = req.files?.find(
        (file) => file.fieldname === "heroImage"
    );

    if (heroImage) {
        if (hero.image?.public_id) {
            await cloudinary.uploader.destroy(hero.image.public_id);
        }

        hero.image = {
            public_id: heroImage.filename,
            url: heroImage.path,
        };
    }

    hero.title = req.body.title || hero.title;
    hero.subtitle = req.body.subtitle || hero.subtitle;
    hero.order = req.body.order ?? hero.order;
    hero.isActive = req.body.isActive ?? hero.isActive;

    await hero.save();

    res.json(hero);
});


export const deleteHero = asyncHandler(async (req, res) => {
    const hero = await Hero.findById(req.params.id);

    if (!hero) {
        return res.status(404).json({ message: "Hero not found" });
    }

    if (hero.image?.public_id) {
        await cloudinary.uploader.destroy(hero.image.public_id);
    }

    await hero.deleteOne();

    res.json({ message: "Hero deleted successfully" });
});

export const getActiveHeroes = asyncHandler(async (req, res) => {
    const heroes = await Hero.find({ isActive: true }).sort({ order: 1 });
    res.json(heroes);
});

export const getAllHeroes = asyncHandler(async (req, res) => {
    const heroes = await Hero.find().sort({ order: 1 });
    res.json(heroes);
});

