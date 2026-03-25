
// src/api/v1/routes/blog.routes.js (UPDATED)

import { Router } from "express";
import {
    createBlog,
    getBlogBySlug,
    updateBlog,
    deleteBlog,
    getAllBlogs,
    toggleLike,     
    addComment,
    getBlogById,
    getBlogsByUser 
} from "../controllers/blog.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { redisCache } from "../middlewares/cache.middleware.js";

const router = Router();

// --- Public routes (Cached for 30 minutes) ---
router.route("/").get(redisCache(1800), getAllBlogs);
router.route("/:slug").get(redisCache(1800), getBlogBySlug);

// --- Secured routes ---
router.route("/").post(verifyJWT, upload.single("coverImage"), createBlog);
router.route("/:id").put(verifyJWT, upload.single("coverImage"), updateBlog);
router.route("/:id").delete(verifyJWT, deleteBlog);

// New routes for likes and comments
router.route("/:id/like").patch(verifyJWT, toggleLike);
router.route("/:id/comments").post(verifyJWT, addComment);

// Additional details (Cached for 30 minutes)
router.route("/id/:id").get(redisCache(1800), getBlogById); 
router.route("/user/:userId").get( redisCache(1800), getBlogsByUser);


export default router;
