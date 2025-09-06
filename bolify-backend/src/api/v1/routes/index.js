// src/api/v1/routes/index.js (UPDATED)

import { Router } from "express";
import authRouter from "./auth.routes.js";
import userRouter from "./user.routes.js";
import blogRouter from "./blog.routes.js";
import tagRouter from "./tag.routes.js";
import searchRouter from "./search.routes.js";
import commentRouter from "./comment.routes.js";
import adminRouter from "./admin.routes.js";
import categoryRouter from "./category.routes.js"; // Import the new category router

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/blogs", blogRouter);
router.use("/tags", tagRouter);
router.use("/categories", categoryRouter); // Use the category router
router.use("/search", searchRouter);
router.use("/comments", commentRouter);
router.use("/admin", adminRouter);

export default router;