import mongoose from "mongoose";
const Schema = mongoose.Schema;

const SubSchema = new Schema(
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
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        }
    },
    { timestamps: true }
);
const Sub = mongoose.model("Sub", SubSchema);

export default Sub;