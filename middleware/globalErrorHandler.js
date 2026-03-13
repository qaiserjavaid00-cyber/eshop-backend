// export const globalErrhandler = (err, req, res, next) => {
//     //stack
//     //message
//     const stack = err?.stack;
//     const statusCode = err?.statusCode ? err?.statusCode : 500;
//     const message = err?.message;
//     res.status(statusCode).json({
//         stack,
//         message,
//     });
// };



export const globalErrhandler = (err, req, res, next) => {
    const statusCode =
        err.statusCode ||
        (res.statusCode !== 200 ? res.statusCode : 500);

    res.status(statusCode).json({
        message: err.message || "Something went wrong",
        stack:
            process.env.NODE_ENV === "production"
                ? null
                : err.stack,
    });
};

//404 handler
export const notFound = (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    next(err);
};
