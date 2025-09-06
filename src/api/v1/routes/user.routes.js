// src/api/v1/routes/user.routes.js (UPDATED)

import { Router } from "express";
import {
    getCurrentUser,
    getUserProfile,
    updateUserAvatar,
    updateUserDetails,
    getAllUsers, 
    changeCurrentUserPassword,
    generateAndSendMobileOtp,
    verifyMobileOtp,
} from "../controllers/user.controller.js";
import { getMyBlogs } from "../controllers/blog.controller.js"; // Import from blog controller
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// --- Public Routes ---
router.route("/").get(getAllUsers); // New public route to list all authors

// --- Secured routes MUST come before dynamic routes ---
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/me").patch(verifyJWT, updateUserDetails);
router.route("/me/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/me/blogs").get(verifyJWT, getMyBlogs); // New secured route for user's own blogs
router.route("/me/change-password").patch(verifyJWT, changeCurrentUserPassword);
router.route("/me/send-mobile-otp").post(verifyJWT, generateAndSendMobileOtp);
router.route("/me/verify-mobile-otp").post(verifyJWT, verifyMobileOtp);

// --- Public dynamic route comes last ---
router.route("/:username").get(getUserProfile);

export default router;
