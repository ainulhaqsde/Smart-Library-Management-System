/* =========================================================
   NOT FOUND HANDLER
========================================================= */

exports.notFound = (req, res) => {
    return res.status(404).json({
        message: "Resource not found"
    });
};


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

exports.errorHandler = (
    err,
    req,
    res,
    next
) => {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    const status = err.status || 500;

    res.status(status).json({
        message:
            process.env.NODE_ENV ===
                "production" &&
            status === 500
                ? "Internal server error"
                : err.message ||
                  "Internal server error"
    });
};