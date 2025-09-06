// src/api/v1/routes/tag.routes.js (UPDATED)

import { Router } from "express";
import { createTag, getAllTags, getBlogsByTag, updateTag, deleteTag } from "../controllers/tag.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
// Public
router.route("/").get(getAllTags);
router.route("/:slug/blogs").get(getBlogsByTag);
// Admin
router.route("/").post(verifyJWT, createTag);
router.route("/:tagId").put(verifyJWT, verifyAdmin, updateTag); // New route
router.route("/:tagId").delete(verifyJWT, verifyAdmin, deleteTag); // New route

export default router;