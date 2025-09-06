// src/api/v1/routes/search.routes.js

import { Router } from "express";
import { searchSite } from "../controllers/search.controller.js";

const router = Router();

// A single public route for all search queries
router.route("/").get(searchSite);

export default router;
