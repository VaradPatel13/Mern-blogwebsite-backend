// src/api/v1/routes/search.routes.js

import { Router } from "express";
import { searchBlogs, getSearchFacets } from "../controllers/search.controller.js";

const router = Router();

// Public search routes — no Redis cache (search results are dynamic and user-specific)
router.route("/").get(searchBlogs);
router.route("/facets").get(getSearchFacets);

export default router;
