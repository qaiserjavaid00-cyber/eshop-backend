import { z } from "zod";

export const productQuerySchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),

    color: z.union([z.string(), z.array(z.string())]).optional(),
    size: z.union([z.string(), z.array(z.string())]).optional(),

    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),

    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(9),
    sort: z.string().optional(),
});
