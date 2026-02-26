import { z } from "zod";

export const variantSchema = z.object({
    _id: z.string().nullable().optional(),

    size: z.string().min(1),
    color: z.string().min(1),

    price: z.coerce.number().positive(),
    quantity: z.coerce.number().int().min(0),

    isFlashDeal: z.coerce.boolean().optional().default(false),
    salePrice: z.coerce.number().positive().nullable().optional(),

    saleStart: z.preprocess(
        val => {
            if (!val) return null;
            const date = new Date(val);
            return isNaN(date.getTime()) ? undefined : date;
        },
        z.date().nullable().optional()
    ),

    saleEnd: z.preprocess(
        val => {
            if (!val) return null;
            const date = new Date(val);
            return isNaN(date.getTime()) ? undefined : date;
        },
        z.date().nullable().optional()
    ),

    isOnSale: z.coerce.boolean().optional().default(false),
    regularSalePrice: z.coerce.number().positive().nullable().optional(),

    specifications: z.preprocess(
        val => {
            if (!val) return [];
            if (typeof val === "string") return JSON.parse(val);
            return val;
        },
        z.array(z.object({ key: z.string(), value: z.string() })).optional()
    ),

    tags: z.preprocess(
        val => {
            if (!val) return [];
            if (typeof val === "string") return JSON.parse(val);
            return val;
        },
        z.array(z.string()).optional()
    ),

    images: z.array(z.string()).optional(),
})
    .superRefine((variant, ctx) => {
        // 1️⃣ Both cannot be true
        if (variant.isFlashDeal && variant.isOnSale) {
            ctx.addIssue({
                path: ["isFlashDeal"],
                code: "custom",
                message: "A variant cannot be on flash deal and regular sale at the same time.",
            });
            ctx.addIssue({
                path: ["isOnSale"],
                code: "custom",
                message: "A variant cannot be on flash deal and regular sale at the same time.",
            });
        }

        // 2️⃣ Flash deal requires all associated fields
        if (variant.isFlashDeal) {
            if (!variant.salePrice) {
                ctx.addIssue({
                    path: ["salePrice"],
                    code: "custom",
                    message: "salePrice is required when isFlashDeal is true.",
                });
            }
            if (!variant.saleStart) {
                ctx.addIssue({
                    path: ["saleStart"],
                    code: "custom",
                    message: "saleStart is required when isFlashDeal is true.",
                });
            }
            if (!variant.saleEnd) {
                ctx.addIssue({
                    path: ["saleEnd"],
                    code: "custom",
                    message: "saleEnd is required when isFlashDeal is true.",
                });
            }
        }

        // 3️⃣ Regular sale requires regularSalePrice
        if (variant.isOnSale && !variant.regularSalePrice) {
            ctx.addIssue({
                path: ["regularSalePrice"],
                code: "custom",
                message: "regularSalePrice is required when isOnSale is true.",
            });
        }
    });
