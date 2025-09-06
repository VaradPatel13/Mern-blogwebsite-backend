
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

const router = Router();

// --- Public routes ---
router.route("/").get(getAllBlogs);
router.route("/:slug").get(getBlogBySlug);

// --- Secured routes ---
router.route("/").post(verifyJWT, upload.single("coverImage"), createBlog);
router.route("/:id").put(verifyJWT, upload.single("coverImage"), updateBlog);
router.route("/:id").delete(verifyJWT, deleteBlog);

// New routes for likes and comments
router.route("/:id/like").patch(verifyJWT, toggleLike);
router.route("/:id/comments").post(verifyJWT, addComment);

router.route("/id/:id").get(getBlogById); 
router.route("/user/:userId").get( getBlogsByUser);


export default router;
