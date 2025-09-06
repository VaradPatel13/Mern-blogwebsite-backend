// src/api/v1/middlewares/auth.middleware.js

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            // This case handles scenarios where the user has been deleted,
            // but their token is still valid.
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        // Handle token expiration or verification failure
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

// --- MIDDLEWARE TO VERIFY ADMIN---
export const verifyAdmin = asyncHandler(async (req, _, next) => {
    // verifyJWT must have run before this, so req.user should exist
    if (req.user?.role !== "ADMIN") {
        throw new ApiError(403, "Forbidden: You do not have administrative privileges.");
    }
    next();
});