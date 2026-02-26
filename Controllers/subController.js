import asyncHandler from "express-async-handler";
import Sub from "../Models/Sub.js"
import slugify from "slugify";

export const create = asyncHandler(async (req, res) => {
    const { name, parent } = req.body;
    const sub = await Sub.create({
        name: name,
        slug: slugify(`${name}`),
        parent: parent,

    });
    res.json({
        status: "success",
        message: "Category created successfully",
        sub,
    });
    //category exists
    // const subFound = await Sub.findOne({ name });
    // // if (subFound) {
    // //     throw new Error("sub already exists");
    // // }
    // const parentFound = await Sub.findOne({ parent });

    // if (subFound && parentFound) {
    //     console.log(subFound, parentFound)
    //     throw new Error(`${subFound} already exists in ${parentFound}`);
    // }
    //create

    // if (!subFound && !parentFound) {
    //     console.log("!subFound, !parentFound", name, parent)
    //     const sub = await Sub.create({
    //         name: name,
    //         slug: slugify(`${name}`),
    //         parent: parent,

    //     });

    //     res.json({
    //         status: "success",
    //         message: "Category created successfully",
    //         sub,
    //     });

    // }

    // if (subFound && !parentFound) {
    //     console.log("subFound, !parentFound", name, parent)
    //     subFound.parent.push(parent);

    //     res.json({
    //         status: "success",
    //         message: "parent pushed to subCategory",

    //     });

    // }


});

export const list = asyncHandler(async (req, res) => {

    const subs = await Sub.find();

    res.status(201).json({
        success: true,
        count: subs.length,
        subs,
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
export const deleteSub = asyncHandler(async (req, res) => {
    await Sub.findByIdAndDelete(req.params.id);
    res.json({
        status: "success",
        message: "Category deleted successfully",
    });
});


// @desc    find sub By parent ID
// @route   siglw  /api/categories/:id
// @access  Private/Admin
export const singleSubById = asyncHandler(async (req, res) => {
    const convertedId = req.params.id
    const sub = await Sub.find({ parent: convertedId })
    res.json({
        status: "success",
        message: "single sub category belonging to a single category fteched successfully",
        sub
    });
});


