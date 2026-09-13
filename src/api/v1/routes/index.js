import { Router } from "express";
import authRouter from "./auth.routes.js";
import userRouter from "./user.routes.js";
import blogRouter from "./blog.routes.js";
import tagRouter from "./tag.routes.js";
import searchRouter from "./search.routes.js";
import commentRouter from "./comment.routes.js";
import adminRouter from "./admin.routes.js";
import categoryRouter from "./category.routes.js";
import seoRouter from "./seo.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/blogs", blogRouter);
router.use("/tags", tagRouter);
router.use("/categories", categoryRouter);
router.use("/search", searchRouter);
router.use("/comments", commentRouter);
router.use("/admin", adminRouter);
router.use("/seo", seoRouter);

export default router;