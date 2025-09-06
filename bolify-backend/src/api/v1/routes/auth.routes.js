// src/api/v1/routes/auth.routes.js (UPDATED)

import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    forgotPassword, // Import new controllers
    resetPassword,
    googleLogin
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(forgotPassword); // Add new route
router.route("/reset-password/:token").patch(resetPassword); // Add new route
router.route("/google-login").post(googleLogin);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);

export default router;