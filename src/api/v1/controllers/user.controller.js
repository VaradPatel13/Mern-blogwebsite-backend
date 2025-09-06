// src/api/v1/controllers/user.controller.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import imagekit from "../utils/imagekit.js";
import { sendOtpEmail } from '../../../config/nodemailer.js';
import bcrypt from "bcryptjs";

/**
 * @description Get the profile of the currently authenticated user.
 * @route GET /api/v1/users/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    // The user object is attached to the request by the verifyJWT middleware
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

/**
 * @description Update user details like fullName and email.
 * @route PATCH /api/v1/users/me
 */
const updateUserDetails = asyncHandler(async (req, res) => {
    // Now accepts fullName, username, and mobileNumber
    const { fullName, username, mobileNumber } = req.body;

    if (!fullName && !username && !mobileNumber) {
        throw new ApiError(400, "At least one field is required to update.");
    }

    // Prevent users from updating to an existing username
    if (username) {
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
            throw new ApiError(409, "This username is already taken.");
        }
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { 
                fullName: fullName || req.user.fullName,
                username: username || req.user.username,
                mobileNumber: mobileNumber || req.user.mobileNumber,
            },
        },
        { new: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated successfully"));
});

/**
 * @description Update the avatar for the authenticated user.
 * @route PATCH /api/v1/users/me/avatar
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Avatar file is required");
    }

    try {
        // Upload the file to ImageKit
        const uploadedImage = await imagekit.upload({
            file: req.file.buffer,
            fileName: `avatar_${req.user._id}_${Date.now()}`,
            folder: "bolify/avatars",
        });

        // Update the user's avatar URL in the database
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: { avatar: uploadedImage.url },
            },
            { new: true }
        ).select("-password");

        // TODO: Optionally, delete the old avatar from ImageKit to save space

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Avatar updated successfully"));

    } catch (error) {
        throw new ApiError(500, "Error uploading avatar to ImageKit");
    }
});

/**
 * @description Get a user's public profile by their username.
 * @route GET /api/v1/users/:username
 */
    const getUserProfile = asyncHandler(async (req, res) => {
        const { username } = req.params;

        if (!username?.trim()) {
            throw new ApiError(400, "Username is required");
        }

        const user = await User.findOne({ username: username.toLowerCase() }).select(
            "-password -refreshToken -email" 
        );

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // TODO: We can also fetch the user's published blogs here later

        return res
            .status(200)
            .json(new ApiResponse(200, user, "User profile fetched successfully"));
    });

/**
 * @description Get a paginated list of all users (authors).
 * @route GET /api/v1/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const users = await User.aggregatePaginate(
        User.aggregate([
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    createdAt: 1,
                },
            },
        ]),
        { page: parseInt(page), limit: parseInt(limit) }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, users, "Authors fetched successfully"));
});

// --- NEW FUNCTION ---
const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password.");
    }

    user.password = newPassword; // The 'pre-save' hook in the model will hash it
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully."));
});

// --- NEW FUNCTIONS ---
const generateAndSendMobileOtp = asyncHandler(async (req, res) => {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
        throw new ApiError(400, "Mobile number is required.");
    }

    const user = await User.findById(req.user._id);

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP before saving
    user.mobileOtp = await bcrypt.hash(otp, 10);
    user.mobileOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    user.mobileNumber = mobileNumber;
    user.isMobileVerified = false; // Reset verification status
    await user.save({ validateBeforeSave: false });

    // Send the plain OTP to the user's email
    await sendOtpEmail(user.email, otp);

    return res.status(200).json(new ApiResponse(200, {}, "OTP sent to your registered email successfully."));
});

const verifyMobileOtp = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    if (!otp) {
        throw new ApiError(400, "OTP is required.");
    }

    const user = await User.findById(req.user._id);

    if (!user.mobileOtp || user.mobileOtpExpires < Date.now()) {
        throw new ApiError(400, "OTP has expired or is invalid. Please request a new one.");
    }

    const isOtpCorrect = await user.isMobileOtpCorrect(otp);

    if (!isOtpCorrect) {
        throw new ApiError(401, "Invalid OTP.");
    }

    user.isMobileVerified = true;
    user.mobileOtp = undefined;
    user.mobileOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, { isMobileVerified: true }, "Mobile number verified successfully."));
});


export {
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    getUserProfile,
    getAllUsers,
    changeCurrentUserPassword,
    generateAndSendMobileOtp,
    verifyMobileOtp,
};