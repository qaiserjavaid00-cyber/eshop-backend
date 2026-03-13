import mongoose from "mongoose";

const aboutSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            maxlength: 150,
            default: "About Us",
        },

        description: {
            type: String,
            maxlength: 5000,
            default: "",
        },

        video: {
            url: {
                type: String,
                default: "",
            },
            public_id: {
                type: String,
                default: "",
            },
        },

        mission: {
            type: String,
            maxlength: 1000,
            default: "",
        },

        vision: {
            type: String,
            maxlength: 1000,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const About = mongoose.model("About", aboutSchema);

export default About;