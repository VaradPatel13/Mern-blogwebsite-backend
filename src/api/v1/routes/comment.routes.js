
// src/api/v1/routes/comment.routes.js

import { Router } from "express";
import { body } from "express-validator";
import { createComment, getBlogComments, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";

const router = Router();

// Public: anyone can read comments
router.route("/:blogId").get(getBlogComments);

// Protected: must be logged in to create, update, delete
router.route("/:blogId").post(
    verifyJWT,
    [body("text", "Comment text cannot be empty").notEmpty()],
    validate,
    createComment
);

router.route("/c/:commentId").patch(
    verifyJWT,
    [body("text", "Comment text cannot be empty").notEmpty()],
    validate,
    updateComment
);

router.route("/c/:commentId").delete(verifyJWT, deleteComment);

export default router;
