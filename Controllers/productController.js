import asyncHandler from "express-async-handler";
import slugify from "slugify";
import mongoose from "mongoose";

import User from "../Models/User.js";
import Product from "../Models/Product.js";
import Variant from "../Models/Variant.js";
import Category from "../Models/Category.js";
import Sub from "../Models/Sub.js";

// @desc    Create a product with variants
// @route   POST /api/products
// @access  Private/Admin

// -------------------- CREATE PRODUCT --------------------
export const create = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        category,
        sub,
        brand,
        shipping,
        basePrice,
        stock,
        hasVariant,
        isFeatured,
        specifications,
        tags,
        variants
    } = req.body;

    // -------------------- PRODUCT IMAGES --------------------
    const productImages = [];
    (req.files || []).forEach(file => {
        if (file.fieldname === "productImages") productImages.push(file.path);
    });

    // -------------------- 1️⃣ CREATE PRODUCT --------------------
    const product = await Product.create({
        title,
        slug: slugify(title),
        description,
        category,
        sub: sub ? (Array.isArray(sub) ? sub : [sub]) : [],
        brand,
        shipping,
        images: productImages,
        basePrice: hasVariant ? null : basePrice,
        stock: hasVariant ? null : stock,
        hasVariant,
        isFeatured,
        specifications,
        tags
    });

    let variantDocs = [];

    // -------------------- 2️⃣ CREATE VARIANTS --------------------
    if (hasVariant && variants?.length) {
        // Group files by variant index (variantImages_0, variantImages_1, etc.)
        const filesByVariant = {};
        (req.files || []).forEach(file => {
            if (file.fieldname.startsWith("variantImages_")) {
                const index = file.fieldname.split("_")[1];
                if (!filesByVariant[index]) filesByVariant[index] = [];
                filesByVariant[index].push(file.path);
            }
        });

        // Create all variants
        variantDocs = await Promise.all(
            variants.map((v, idx) => {
                return Variant.create({
                    productId: product._id,
                    size: v.size,
                    color: v.color,
                    price: Number(v.price),
                    quantity: Number(v.quantity),
                    sold: 0,
                    isFlashDeal: v.isFlashDeal || false,
                    salePrice: v.salePrice || null,
                    saleStart: v.saleStart ? new Date(v.saleStart) : null,
                    saleEnd: v.saleEnd ? new Date(v.saleEnd) : null,
                    isOnSale: v.isOnSale || false,
                    regularSalePrice: v.regularSalePrice || null,
                    specifications: v.specifications || [],
                    tags: v.tags || [],
                    images: filesByVariant[v.tempId ?? idx] || [],
                });
            })
        );
    }

    // -------------------- RESPONSE --------------------
    res.status(201).json({
        success: true,
        message: "Product and variants created successfully",
        product,
        variants: variantDocs
    });
});


///////Alll products

export const listProducts = asyncHandler(async (req, res) => {

    const products = await Product.find().populate("category");

    res.status(201).json({
        success: true,
        count: products.length,
        products,
    });

});

/////flash
// GET /api/products/flash
export const getFlashProducts = asyncHandler(async (req, res) => {

    const now = new Date();

    const flashVariants = await Variant.find({
        isFlashDeal: true,
        salePrice: { $ne: null },
        saleStart: { $lte: now },
        saleEnd: { $gte: now },
        quantity: { $gt: 0 },
    })
        .populate({
            path: "productId",
            select: "title slug images category brand",
        })
        .sort({ saleEnd: 1 }) // ending soon first
        .lean();

    const validVariants = flashVariants.filter(v => v.productId);
    const products = validVariants.map(v => ({
        variantId: v._id,
        productId: v.productId._id,
        title: v.productId.title,
        slug: v.productId.slug,
        images: v.images.length ? v.images : v.productId.images,
        originalPrice: v.price,
        flashPrice: v.salePrice,
        saleEnd: v.saleEnd,
        quantity: v.quantity,
        size: v.size,
        color: v.color,
    }));

    res.status(200).json({
        success: true,
        count: products.length,
        products,
    });
});


// GET /api/products/sale
export const getSaleProducts = asyncHandler(async (req, res) => {
    const saleVariants = await Variant.find({
        isOnSale: true,
        regularSalePrice: { $ne: null },
        quantity: { $gt: 0 },
    })
        .populate({
            path: "productId",
            select: "title slug images category",
        })
        .sort({ updatedAt: -1 })
        .lean();
    const validVariants = saleVariants.filter(v => v.productId);
    const products = validVariants.map(v => ({
        variantId: v._id,
        productId: v.productId._id,
        title: v.productId.title,
        slug: v.productId.slug,
        images: v.images.length ? v.images : v.productId.images,
        originalPrice: v.price,
        salePrice: v.regularSalePrice,
        quantity: v.quantity,
        size: v.size,
        color: v.color,
    }));

    res.status(200).json({
        success: true,
        count: products.length,
        products,
    });
});

// @desc    delete product
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({
        status: "success",
        message: "Category deleted successfully",
    });
});


// @desc    Single product
// @route   GET /api/product/:id
// @access  
export const getProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate("category").populate("sub");
    res.json({
        status: "success",
        message: "Product fetched successfully",
        product

    });
});

///// @desc    Update product with variants
// @route   PUT /api/products/:id
// @access  Private/Admin

export const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    /* -------------------- DATA (already validated by Zod) -------------------- */
    const {
        title,
        description,
        category,
        sub,
        brand,
        shipping,
        tags,
        specifications,
        variants,
        basePrice,
        stock,
        hasVariant,
        isFeatured,
        existingImages
    } = req.body;

    /* -------------------- PRODUCT IMAGES -------------------- */

    const uploadedImages = [];
    const variantFiles = {};
    const variantExistingImages = {};

    (req.files || []).forEach(file => {
        if (file.fieldname === "productImages") {
            uploadedImages.push(file.path);
        }

        if (file.fieldname.startsWith("variantImages_")) {
            const idx = file.fieldname.split("_")[1];
            if (!variantFiles[idx]) variantFiles[idx] = [];
            variantFiles[idx].push(file.path);
        }
    });

    /* -------------------- PARSE EXISTING PRODUCT IMAGES -------------------- */
    let parsedExistingImages = [];
    if (typeof existingImages === "string") {
        parsedExistingImages = JSON.parse(existingImages || "[]");
    } else if (Array.isArray(existingImages)) {
        parsedExistingImages = existingImages;
    }

    const finalImages = [...parsedExistingImages, ...uploadedImages];

    /* -------------------- PARSE EXISTING VARIANT IMAGES -------------------- */

    Object.keys(req.body).forEach(key => {
        if (key.startsWith("variantExistingImages_")) {
            const idx = key.split("_")[1];
            try {
                variantExistingImages[idx] = JSON.parse(req.body[key] || "[]");
            } catch {
                variantExistingImages[idx] = [];
            }
        }
    });
    /* -------------------- UPDATE PRODUCT -------------------- */

    const product = await Product.findByIdAndUpdate(
        id,
        {
            title,
            slug: slugify(title),
            description,
            category,
            sub: sub ? (Array.isArray(sub) ? sub : [sub]) : [],
            brand,
            shipping,
            images: finalImages,
            hasVariant,
            isFeatured,
            basePrice: hasVariant ? null : basePrice,
            stock: hasVariant ? null : stock,
            tags,
            specifications,
        },
        { new: true, runValidators: true }
    );

    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    /* -------------------- VARIANT SYNC -------------------- */

    let variantDocs = [];

    if (hasVariant && variants) {
        const incomingIds = variants.filter(v => v._id).map(v => v._id);

        // Delete removed variants
        await Variant.deleteMany({
            productId: id,
            _id: { $nin: incomingIds },
        });

        variantDocs = await Promise.all(
            variants.map(async (v, idx) => {
                console.log("Incoming variant specs:", v.specifications);
                console.log("Incoming variant _id:", v._id);

                const key = v.tempId ?? idx;

                const newUploads = variantFiles[key] || [];
                const existingUrls = variantExistingImages[key];

                console.log("URLS of Images: ", existingUrls)

                if (v._id) {
                    const existingVariant = await Variant.findById(v._id);
                    if (!existingVariant) return null;

                    Object.assign(existingVariant, {
                        size: v.size,
                        color: v.color,
                        price: Number(v.price),
                        quantity: Number(v.quantity),
                        isFlashDeal: v.isFlashDeal,
                        salePrice: v.salePrice,
                        saleStart: v.saleStart ? new Date(v.saleStart) : null,
                        saleEnd: v.saleEnd ? new Date(v.saleEnd) : null,
                        isOnSale: v.isOnSale,
                        regularSalePrice: v.regularSalePrice,
                        tags: v.tags,
                        specifications: v.specifications,
                        images: [
                            ...(existingUrls !== undefined
                                ? existingUrls
                                : existingVariant.images || []),
                            ...newUploads,
                        ],
                    });

                    await existingVariant.save();
                    return existingVariant;
                }

                // Create new variant
                return await Variant.create({
                    productId: product._id,
                    ...v,
                    price: Number(v.price),
                    quantity: Number(v.quantity),
                    images: newUploads,
                    sold: 0,
                });
            })
        );

        variantDocs = variantDocs.filter(Boolean);
    } else {
        await Variant.deleteMany({ productId: id });
    }

    /* -------------------- RESPONSE -------------------- */
    console.log("variants", variantDocs)
    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
        variants: variantDocs,
    });
});


/// @desc   Update product with variants
// @route   GET /api/products
// @access  Public

export const getProducts = asyncHandler(async (req, res) => {
    const {
        search,
        category,
        subCategory,
        brand,
        color,
        size,
        minPrice,
        maxPrice,
        sort,
        tags,
        specifications,
        page = 1,
        limit = 20,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    /* -------------------- PRODUCT MATCH -------------------- */
    const productMatch = {};

    if (search) {
        productMatch.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    if (category) {
        const categories = Array.isArray(category) ? category : [category];
        productMatch.category = {
            $in: categories.map(id => new mongoose.Types.ObjectId(id)),
        };
    }

    if (subCategory) {
        const subs = Array.isArray(subCategory) ? subCategory : [subCategory];
        productMatch.sub = {
            $in: subs.map(id => new mongoose.Types.ObjectId(id)),
        };
    }

    if (brand) productMatch.brand = brand;

    /* -------------------- AGGREGATION PIPELINE -------------------- */
    const pipeline = [
        { $match: productMatch },

        {
            $lookup: {
                from: "variants",
                localField: "_id",
                foreignField: "productId",
                as: "variants",
            },
        },

        {
            $addFields: {
                minPrice: {
                    $cond: [
                        { $eq: ["$hasVariant", true] },
                        { $min: "$variants.price" },
                        "$basePrice",
                    ],
                },
                maxPrice: {
                    $cond: [
                        { $eq: ["$hasVariant", true] },
                        { $max: "$variants.price" },
                        "$basePrice",
                    ],
                },
                totalSold: {
                    $cond: [
                        { $eq: ["$hasVariant", true] },
                        { $sum: "$variants.sold" },
                        "$sold",
                    ],
                },
            },
        },
    ];

    /* -------------------- COLOR FILTER -------------------- */
    if (color) {
        const colors = Array.isArray(color) ? color : [color];
        pipeline.push({
            $match: {
                variants: {
                    $elemMatch: { color: { $in: colors } },
                },
            },
        });
    }

    /* -------------------- SIZE FILTER -------------------- */
    if (size) {
        const sizes = Array.isArray(size) ? size : [size];
        pipeline.push({
            $match: {
                variants: {
                    $elemMatch: { size: { $in: sizes } },
                },
            },
        });
    }

    /* -------------------- PRICE FILTER -------------------- */
    if (minPrice || maxPrice) {
        pipeline.push({
            $match: {
                minPrice: { ...(minPrice && { $gte: Number(minPrice) }) },
                maxPrice: { ...(maxPrice && { $lte: Number(maxPrice) }) },
            },
        });
    }

    /* -------------------- TAGS FILTER -------------------- */
    if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        pipeline.push({
            $match: {
                $or: [
                    { tags: { $in: tagsArray } },
                    { "variants.tags": { $in: tagsArray } },
                ],
            },
        });
    }

    /* -------------------- SPECIFICATIONS FILTER (CLEAN JSON) -------------------- */
    if (specifications) {
        let specObj = {};

        try {
            specObj = JSON.parse(specifications);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: "Invalid specifications format",
            });
        }

        const specFilters = Object.entries(specObj).map(([key, values]) => ({
            $or: [
                {
                    specifications: {
                        $elemMatch: { key, value: { $in: values } },
                    },
                },
                {
                    "variants.specifications": {
                        $elemMatch: { key, value: { $in: values } },
                    },
                },
            ],
        }));

        if (specFilters.length) {
            pipeline.push({ $match: { $and: specFilters } });
        }
    }

    /* -------------------- SORT -------------------- */
    const sortMap = {
        pricelh: { minPrice: 1 },
        pricehl: { maxPrice: -1 },
        newest: { createdAt: -1 },
        bestSeller: { totalSold: -1 },
    };

    pipeline.push({ $sort: sortMap[sort] || { createdAt: -1 } });

    /* -------------------- PAGINATION -------------------- */
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Product.aggregate(countPipeline);
    const totalProducts = countResult[0]?.total || 0;

    pipeline.push({ $skip: skip }, { $limit: Number(limit) });

    const products = await Product.aggregate(pipeline);

    res.status(200).json({
        success: true,
        products,
        currentPage: Number(page),
        totalProducts,
        numOfPages: Math.ceil(totalProducts / limit),
    });
});


//  GET /api/products/:slug


export const getProductBySlug = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug }).populate("category").populate("sub");
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }


    // Calculate average rating
    const ratingCount = product.ratings.length;
    const averageRating =
        ratingCount === 0
            ? 0
            : product.ratings.reduce((acc, r) => acc + r.star, 0) / ratingCount;

    res.json({
        ...product.toObject(),
        averageRating: averageRating.toFixed(1), // e.g., "4.3"
    });

});

////featured Products

export const getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({ isFeatured: true })
            .populate("category", "name slug")
            .sort({ updatedAt: -1 })
            .limit(10);

        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch featured products" });
    }
};


// @desc    Allow rating only once
// @route   PUT /api/product/star
// @access  Private
export const rateProduct = asyncHandler(async (req, res) => {
    const { productId, star } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
        res.status(401);
        throw new Error("User not found");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    const alreadyRated = product.ratings.find(
        (r) => r.postedBy.toString() === user._id.toString()
    );


    if (alreadyRated) {
        res.status(400);
        throw new Error("You have already rated this product.");
    }

    // Add new rating
    product.ratings.push({ star, postedBy: user._id });
    await product.save();

    res.json({
        message: "Rating submitted",
        product
    });
});



// GET /api/filters
export const getFilters = asyncHandler(async (req, res) => {
    const now = new Date();

    // -------------------- VARIANTS --------------------
    const variants = await Variant.find(
        {},
        "price salePrice saleStart saleEnd isFlashDeal regularSalePrice isOnSale color size tags specifications"
    );

    // Unique colors and sizes (sorted)
    const colors = (await Variant.distinct('color')).filter(Boolean).sort();
    const sizes = (await Variant.distinct('size')).filter(Boolean).sort();

    // -------------------- CATEGORIES --------------------
    const categories = await Category.find({}, '_id name').sort({ name: 1 });
    const subCategories = await Sub.find({}, '_id name parent')
        .populate('parent', '_id name')
        .sort({ name: 1 });

    // -------------------- TAGS --------------------
    const productTags = (await Product.distinct("tags")).filter(Boolean);
    const variantTags = (await Variant.distinct("tags")).filter(Boolean);
    const tags = Array.from(new Set([...productTags, ...variantTags])).sort();
    // -------------------- BRANDS --------------------
    const brands = (await Product.distinct("brand"))
        .filter(b => b && b.trim() !== "")
        .sort();

    // -------------------- SPECIFICATIONS --------------------
    const productSpecs = await Product.find({}, "specifications").lean();
    const variantSpecs = await Variant.find({}, "specifications").lean();

    const allSpecs = [...productSpecs, ...variantSpecs]
        .flatMap(item => item.specifications || [])
        .filter(s => s.key && s.value); // remove null/empty

    // Normalize keys: trim spaces + uppercase
    const specifications = allSpecs.reduce((acc, { key, value }) => {
        const normKey = key.trim().toUpperCase();
        if (!acc[normKey]) acc[normKey] = new Set();
        acc[normKey].add(value);
        return acc;
    }, {});

    // Convert sets to sorted arrays
    const specs = {};
    for (const key in specifications) {
        specs[key] = Array.from(specifications[key]).sort();
    }

    // -------------------- PRICE RANGE --------------------
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    variants.forEach(v => {
        let finalPrice = v.price;

        if (v.isFlashDeal && v.salePrice && v.saleStart && v.saleEnd && now >= v.saleStart && now <= v.saleEnd) {
            finalPrice = v.salePrice;
        } else if (v.isOnSale && v.regularSalePrice) {
            finalPrice = v.regularSalePrice;
        }

        if (finalPrice < minPrice) minPrice = finalPrice;
        if (finalPrice > maxPrice) maxPrice = finalPrice;
    });

    if (minPrice === Infinity) minPrice = 0;
    if (maxPrice === -Infinity) maxPrice = 0;

    // -------------------- RESPONSE --------------------
    res.json({
        colors,
        sizes,
        categories,
        subCategories,
        priceRange: { minPrice, maxPrice },
        tags,
        specifications: specs,
        brands,
    });
});

