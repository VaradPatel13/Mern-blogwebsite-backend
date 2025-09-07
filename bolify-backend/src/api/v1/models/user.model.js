// src/api/v1/models/user.model.js

import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Define the User Schema
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true, // For better search performance
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        mobileNumber: {
            type: String,
            trim: true,
        },
        avatar: {
            type: String, // URL from a service like Cloudinary or ImageKit
            required: true,
            default: "https://ik.imagekit.io/neg1amxgpy/Profile_Pic/default_awtar_MDnC7hgbv?updatedAt=1754414667374"
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        },
        role: {
            type: String,
            enum: ["USER", "ADMIN"],
            default: "USER",
        },
        passwordResetToken: String,
        passwordResetExpires: Date,
        isMobileVerified: {
            type: Boolean,
            default: false,
        },
        mobileOtp: String,
        mobileOtpExpires: Date,
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// --- Mongoose Hooks & Methods ---


// Add a method to compare OTPs
userSchema.methods.isMobileOtpCorrect = async function(otp) {
    return await bcrypt.compare(otp, this.mobileOtp);
};


// Hash password before saving the user document
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to check if the provided password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Method to generate an access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

// Method to generate a refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

// Method to generate a password reset token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    // Set token to expire in 10 minutes
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    // Return the unhashed token to be sent via email
    return resetToken;
};


export const User = mongoose.model("User", userSchema);