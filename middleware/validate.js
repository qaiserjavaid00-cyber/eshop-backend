export const validate =
    (schema, property = "body") =>
        (req, res, next) => {
            const result = schema.safeParse(req[property]);

            if (!result.success) {
                console.log("💥 Zod validation failed:", result.error);
                return res.status(400).json({
                    message: "Validation error",
                    errors: result.error.format(),
                });
            }

            req[property] = result.data;
            next();
        };
