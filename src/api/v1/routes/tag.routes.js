// src/api/v1/routes/tag.routes.js (UPDATED)

import { Router } from "express";
import { createTag, getAllTags, getTrendingTags, getBlogsByTag, updateTag, deleteTag } from "../controllers/tag.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import { redisCache } from "../middlewares/cache.middleware.js";

const router = Router();
// Public
router.route("/").get(getAllTags);
router.route("/trending").get(redisCache(300), getTrendingTags);
router.route("/:slug/blogs").get(getBlogsByTag);
// Admin
router.route("/").post(verifyJWT, createTag);
router.route("/:tagId").put(verifyJWT, verifyAdmin, updateTag); // New route
router.route("/:tagId").delete(verifyJWT, verifyAdmin, deleteTag); // New route

export default router;