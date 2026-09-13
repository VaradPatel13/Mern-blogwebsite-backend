import { Router } from "express";
import { sitemap, robotsTxt, rssFeed, seoMeta } from "../controllers/seo.controller.js";

const router = Router();

router.get("/sitemap.xml", sitemap);
router.get("/robots.txt", robotsTxt);
router.get("/feed.xml", rssFeed);
router.get("/seo/:slug", seoMeta);

export default router;
