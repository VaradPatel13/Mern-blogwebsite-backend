// src/api/v1/middlewares/error.middleware.js

import { ApiError } from "../utils/ApiError.js"; // CORRECTED PATH

const errorHandler = (err, req, res, next) => {
    // If the error is an instance of our custom ApiError, use its properties
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    // For all other errors, return a generic 500 server error
    console.error(err); // Log the unexpected error for debugging
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errors: [],
    });
};

export { errorHandler };