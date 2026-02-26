import mongoose from "mongoose";
const Schema = mongoose.Schema;

const CategorySchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: "Name is required",
            minlength: [2, "Too short"],
            maxlength: [32, "Too long"],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            index: true,
        },
        image: {
            type: String, // URL of category image
            default: "",  // optional placeholder if not set
        },
    },
    { timestamps: true }
);
const Category = mongoose.model("Category", CategorySchema);

export default Category;