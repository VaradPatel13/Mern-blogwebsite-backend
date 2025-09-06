// src/api/v1/routes/admin.routes.js (UPDATED)

import { Router } from "express";
import {
    deleteUserByAdmin,
    deleteBlogByAdmin,
    deleteCommentByAdmin,
    getAllUsersByAdmin, // Import new controller
} from "../controllers/admin.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT, verifyAdmin); // Apply admin auth to all routes

router.route("/users").get(getAllUsersByAdmin); // New route
router.route("/users/:userId").delete(deleteUserByAdmin);
router.route("/blogs/:blogId").delete(deleteBlogByAdmin);
router.route("/comments/:commentId").delete(deleteCommentByAdmin);

export default router;