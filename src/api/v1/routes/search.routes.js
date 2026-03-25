// src/api/v1/routes/search.routes.js

import { Router } from "express";
import { searchSite } from "../controllers/search.controller.js";
import { redisCache } from "../middlewares/cache.middleware.js";

const router = Router();

// A single public route for all search queries (Cached for 15 minutes)
router.route("/").get(redisCache(900), searchSite);

export default router;
