
import multer from "multer";
import cloudinaryPackage from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// ---------------- CLOUDINARY CONFIG ----------------
const cloudinary = cloudinaryPackage.v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUND_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------- STORAGE ----------------
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "mern-ecommerce",
        format: "jpg",
        transformation: [{ width: 800, height: 800, crop: "limit" }],
    },
});

// ---------------- FILE FILTER (🔥 SECURITY) ----------------
const fileFilter = (req, file, cb) => {
    const { fieldname, mimetype } = file;

    // ✅ Allow product images
    const isProductImage = fieldname === "productImages";

    // ✅ Allow variant images: variantImages_0, variantImages_1, ...
    const isVariantImage = /^variantImages_\d+$/.test(fieldname);

    const isHeroImage = fieldname === "heroImage";
    // ❌ Reject anything else
    if (!isProductImage && !isVariantImage && !isHeroImage) {
        return cb(
            new Error(`Invalid file field: ${fieldname}`),
            false
        );
    }

    // ❌ Only images
    if (!mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"), false);
    }

    cb(null, true);
};

// ---------------- MULTER INIT ----------------
const fileupload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024, // 5MB per image
    },
});

export default fileupload;
