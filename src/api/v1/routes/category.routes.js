// src/api/v1/routes/category.routes.js (UPDATED)

import { Router } from "express";
import { createCategory, getAllCategories, getBlogsByCategory, updateCategory, deleteCategory } from "../controllers/category.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
// Public
router.route("/").get(getAllCategories);
router.route("/:slug/blogs").get(getBlogsByCategory);
// Admin
router.route("/").post(verifyJWT, createCategory);
router.route("/:categoryId").put(verifyJWT, verifyAdmin, updateCategory); // New route
router.route("/:categoryId").delete(verifyJWT, verifyAdmin, deleteCategory); // New route

export default router;
