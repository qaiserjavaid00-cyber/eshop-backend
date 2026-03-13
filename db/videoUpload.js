import multer from "multer";
import cloudinaryPackage from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

const cloudinary = cloudinaryPackage.v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUND_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔥 Video storage
const videoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "mern-ecommerce/videos",
        resource_type: "video", // IMPORTANT
    },
});

// 🔐 Video filter
const videoFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
        return cb(new Error("Only video files are allowed"), false);
    }

    cb(null, true);
};

const videoUpload = multer({
    storage: videoStorage,
    fileFilter: videoFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
    },
});

export default videoUpload;