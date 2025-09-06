
// src/api/v1/routes/comment.routes.js (NEW FILE)

import { Router } from "express";
import { body } from "express-validator";
import { createComment, getBlogComments, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply JWT auth to all routes in this file

router.route("/:blogId").get(getBlogComments);

router.route("/:blogId").post(
    [body("text", "Comment text cannot be empty").notEmpty()],
    validate,
    createComment
);

router.route("/c/:commentId").patch(
    [body("text", "Comment text cannot be empty").notEmpty()],
    validate,
    updateComment
);

router.route("/c/:commentId").delete(deleteComment);

export default router;
