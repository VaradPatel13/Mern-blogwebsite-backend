import { asyncHandler } from "../utils/asyncHandler.js";
import { Blog } from "../models/blog.model.js";
import { Category } from "../models/category.model.js";

const SITE_URL = process.env.FRONTEND_URL || "https://scribloom.vercel.app";
const SITE_NAME = "Scribloom";
const SITE_DESC = "A digital greenhouse for writers and readers to cultivate compelling stories.";

const sitemap = asyncHandler(async (req, res) => {
    const blogs = await Blog.find({ status: "published" })
        .select("slug createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean();

    const categories = await Category.find().select("slug").lean();

    const staticPages = [
        { url: "/", changefreq: "daily", priority: "1.0" },
        { url: "/home", changefreq: "daily", priority: "1.0" },
        { url: "/about", changefreq: "monthly", priority: "0.8" },
        { url: "/archive", changefreq: "weekly", priority: "0.7" },
        { url: "/editorial-guidelines", changefreq: "monthly", priority: "0.5" },
        { url: "/privacy", changefreq: "yearly", priority: "0.3" },
        { url: "/terms", changefreq: "yearly", priority: "0.3" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n`;
    xml += `  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    for (const page of staticPages) {
        xml += `  <url>\n`;
        xml += `    <loc>${SITE_URL}${page.url}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n`;
    }

    for (const cat of categories) {
        xml += `  <url>\n`;
        xml += `    <loc>${SITE_URL}/category/${cat.slug}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
    }

    for (const blog of blogs) {
        xml += `  <url>\n`;
        xml += `    <loc>${SITE_URL}/blog/${blog.slug}</loc>\n`;
        xml += `    <lastmod>${new Date(blog.updatedAt || blog.createdAt).toISOString()}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.9</priority>\n`;
        xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
});

const robotsTxt = asyncHandler(async (req, res) => {
    const txt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /edit-profile
Disallow: /my-profile
Disallow: /create-post
Disallow: /edit-post

Sitemap: ${SITE_URL}/sitemap.xml

User-agent: GPTBot
Allow: /blog/
Allow: /home
Allow: /about
Allow: /archive
Allow: /editorial-guidelines

User-agent: Google-Extended
Allow: /blog/
Allow: /home
Allow: /about
Allow: /archive

User-agent: CCBot
Allow: /blog/
Allow: /home

User-agent: Anthropic-ai
Allow: /blog/
Allow: /home
Allow: /about

User-agent: PerplexityBot
Allow: /blog/
Allow: /home

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Allow: /blog/
Allow: /home
`;

    res.header("Content-Type", "text/plain");
    res.send(txt);
});

const rssFeed = asyncHandler(async (req, res) => {
    const blogs = await Blog.find({ status: "published" })
        .select("title slug body coverImage createdAt")
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("createdBy", "fullName username")
        .populate("category", "name slug")
        .lean();

    const stripHtml = (html) => html?.replace(/<[^>]*>/g, '')?.trim() || '';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0"\n`;
    xml += `  xmlns:atom="http://www.w3.org/2005/Atom"\n`;
    xml += `  xmlns:content="http://purl.org/rss/1.0/modules/content/"\n`;
    xml += `  xmlns:dc="http://purl.org/dc/elements/1.1/"\n`;
    xml += `  xmlns:media="http://search.yahoo.com/mrss/">\n`;
    xml += `<channel>\n`;
    xml += `  <title>${SITE_NAME}</title>\n`;
    xml += `  <link>${SITE_URL}</link>\n`;
    xml += `  <description>${SITE_DESC}</description>\n`;
    xml += `  <language>en-us</language>\n`;
    xml += `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    xml += `  <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />\n`;

    for (const blog of blogs) {
        const snippet = stripHtml(blog.body).substring(0, 500);
        xml += `  <item>\n`;
        xml += `    <title><![CDATA[${blog.title}]]></title>\n`;
        xml += `    <link>${SITE_URL}/blog/${blog.slug}</link>\n`;
        xml += `    <guid isPermaLink="true">${SITE_URL}/blog/${blog.slug}</guid>\n`;
        xml += `    <description><![CDATA[${snippet}]]></description>\n`;
        xml += `    <content:encoded><![CDATA[${blog.body}]]></content:encoded>\n`;
        xml += `    <dc:creator><![CDATA[${blog.createdBy?.fullName || "Scribloom"}]]></dc:creator>\n`;
        if (blog.category) {
            xml += `    <category><![CDATA[${blog.category.name}]]></category>\n`;
        }
        xml += `    <pubDate>${new Date(blog.createdAt).toUTCString()}</pubDate>\n`;
        if (blog.coverImage) {
            xml += `    <media:content url="${blog.coverImage}" medium="image" />\n`;
        }
        xml += `  </item>\n`;
    }

    xml += `</channel>\n`;
    xml += `</rss>`;

    res.header("Content-Type", "application/rss+xml; charset=utf-8");
    res.send(xml);
});

const seoMeta = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug, status: "published" })
        .select("title body coverImage createdAt updatedAt slug views likes")
        .populate("createdBy", "fullName username avatar")
        .populate("category", "name slug")
        .lean();

    if (!blog) {
        return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const stripHtml = (html) => html?.replace(/<[^>]*>/g, '')?.trim() || '';
    const snippet = stripHtml(blog.body).substring(0, 160);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blog.title,
        "description": snippet,
        "image": blog.coverImage,
        "url": `${SITE_URL}/blog/${blog.slug}`,
        "datePublished": blog.createdAt,
        "dateModified": blog.updatedAt || blog.createdAt,
        "author": {
            "@type": "Person",
            "name": blog.createdBy?.fullName || "Scribloom Writer",
            "url": `${SITE_URL}/profile/${blog.createdBy?.username}`
        },
        "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": SITE_URL,
            "logo": {
                "@type": "ImageObject",
                "url": `${SITE_URL}/logo.png`
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${SITE_URL}/blog/${blog.slug}`
        },
        "articleSection": blog.category?.name || "Uncategorized",
        "wordCount": stripHtml(blog.body).split(/\s+/).length,
        "interactionStatistic": [
            {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/ViewAction",
                "userInteractionCount": blog.views || 0
            },
            {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/LikeAction",
                "userInteractionCount": blog.likes || 0
            }
        ]
    };

    return res.status(200).json({
        success: true,
        data: {
            meta: {
                title: `${blog.title} | ${SITE_NAME}`,
                description: snippet,
                image: blog.coverImage,
                url: `${SITE_URL}/blog/${blog.slug}`,
                type: "article",
                author: blog.createdBy?.fullName,
                publishedTime: blog.createdAt,
                modifiedTime: blog.updatedAt || blog.createdAt
            },
            jsonLd
        }
    });
});

export { sitemap, robotsTxt, rssFeed, seoMeta };
