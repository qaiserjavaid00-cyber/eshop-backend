// controllers/heroController.js

import Hero from "../Models/Hero.js";
import asyncHandler from "express-async-handler";
import cloudinaryPackage from "cloudinary";

const cloudinary = cloudinaryPackage.v2;

export const updateHero = asyncHandler(async (req, res) => {

    let hero = await Hero.findOne();

    let imageData = hero?.image;
    console.log("Image from DB", imageData)

    // find hero image inside req.files
    const heroImage = req.files?.find(
        (file) => file.fieldname === "heroImage"
    );

    if (heroImage) {

        // delete old image from Cloudinary
        if (hero?.image?.public_id) {
            await cloudinary.uploader.destroy(hero.image.public_id);
        }

        // IMPORTANT:
        // With multer-storage-cloudinary:
        // file.path = secure_url
        // file.filename = public_id

        imageData = {
            public_id: heroImage.filename,
            url: heroImage.path,
        };
    }

    if (!hero) {
        hero = await Hero.create({
            title: req.body.title,
            subtitle: req.body.subtitle,
            image: imageData,
        });
    } else {
        hero.title = req.body.title || hero.title;
        hero.subtitle = req.body.subtitle || hero.subtitle;
        hero.image = imageData;
        await hero.save();
    }

    res.json(hero);

});

////get hero image
export const getHero = asyncHandler(async (req, res) => {
    const hero = await Hero.findOne();
    res.status(200).json(hero);
});