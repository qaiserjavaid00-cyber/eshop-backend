import { z } from "zod";
import { variantSchema } from "./variantSchema.js";

export const productBaseSchema = {
    title: z.string().min(3),
    description: z.string().min(10),
    category: z.string(),

    // Arrays coming from FormData (JSON strings)
    sub: z.preprocess(
        val => {
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch {
                    return [];
                }
            }
            return val;
        },
        z.array(z.string()).optional()
    ),

    brand: z.string().optional(),
    shipping: z.enum(["Yes", "No"]).optional(),

    basePrice: z.preprocess(
        val => val === "" || val === null ? null : Number(val),
        z.number().positive().nullable().optional()
    ),
    stock: z.preprocess(
        val => val === "" || val === null ? null : Number(val),
        z.number().int().min(0).nullable().optional()
    ),
    hasVariant: z.preprocess(
        val => val === "true" || val === true,
        z.boolean().optional()
    ),
    isFeatured: z.preprocess(
        val => val === "true" || val === true,
        z.boolean().optional()
    ),

    // Arrays of objects from FormData (JSON strings)
    specifications: z.preprocess(
        val => {
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch {
                    return [];
                }
            }
            return val;
        },
        z.array(z.object({ key: z.string(), value: z.string() })).optional()
    ),

    // Tags array from FormData
    tags: z.preprocess(
        val => {
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch {
                    return [];
                }
            }
            return val;
        },
        z.array(z.string()).optional()
    ),
};

// Full schema for creating a product
export const createProductSchema = z.object({
    ...productBaseSchema,
    variants: z.preprocess(
        val => {
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch {
                    return [];
                }
            }
            return val;
        },
        z.array(variantSchema).optional()
    ),
});

// Full schema for updating a product


export const updateProductSchema = z
    .object({
        ...productBaseSchema,
        variants: z.preprocess(
            val => {
                if (typeof val === "string") {
                    try { return JSON.parse(val); } catch { return []; }
                }
                return val;
            },
            z.array(variantSchema).optional()
        ),
        existingImages: z.preprocess(
            val => {
                if (typeof val === "string") {
                    try {
                        return JSON.parse(val); // parse stringified array
                    } catch {
                        return [val]; // single image as string
                    }
                }
                if (Array.isArray(val)) return val;
                return [];
            },
            z.array(z.string())
        )
    })
    .catchall(z.any())
    .superRefine((data, ctx) => {



        /* ---------- NO VARIANTS ---------- */
        if (data.hasVariant === false) {
            if (data.basePrice === null) {
                ctx.addIssue({
                    path: ["basePrice"],
                    message: "basePrice is required when hasVariant is false",
                    code: "custom",
                });
            }

            if (data.stock === null) {
                ctx.addIssue({
                    path: ["stock"],
                    message: "stock is required when hasVariant is false",
                    code: "custom",
                });
            }

            if (data.variants && data.variants.length > 0) {
                ctx.addIssue({
                    path: ["variants"],
                    message: "Variants must be empty when hasVariant is false",
                    code: "custom",
                });
            }
        }
    });
