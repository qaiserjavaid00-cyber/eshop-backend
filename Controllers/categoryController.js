import asyncHandler from "express-async-handler";
import Category from "../Models/Category.js"
import slugify from "slugify";

export const create = asyncHandler(async (req, res) => {
    const { name } = req.body;
    //category exists
    const categoryFound = await Category.findOne({ name });
    if (categoryFound) {
        throw new Error("Category already exists");
    }
    //create
    const category = await Category.create({
        name: name,
        slug: slugify(`${name}`),


    });

    res.json({
        status: "success",
        message: "Category created successfully",
        category,
    });
});

export const list = asyncHandler(async (req, res) => {

    const categories = await Category.find();

    res.status(201).json({
        success: true,
        count: categories.length,
        categories,
    });

});


// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const update = asyncHandler(async (req, res) => {
    const { name } = req.body;

    //update
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name,
        },
        {
            new: true,
        }
    );
    res.json({
        status: "success",
        message: "category updated successfully",
        category,
    });
});

// @desc    delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    res.json({
        status: "success",
        message: "Category deleted successfully",
    });
});


export const singleCatById = asyncHandler(async (req, res) => {
    const Id = req.params.id
    const sub = await Category.findById(Id)
    res.json({
        status: "success",
        message: "single category fteched successfully",
        sub
    });
});
