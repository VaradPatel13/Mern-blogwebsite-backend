// src/api/v1/controllers/search.controller.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Blog } from "../models/blog.model.js";

const searchBlogs = asyncHandler(async (req, res) => {
    const {
        q: query,
        page = 1,
        limit = 12,
        category,
        tag,
        sortBy = "relevance"
    } = req.query;

    if (!query || !query.trim()) {
        return res.status(200).json(
            new ApiResponse(200, { blogs: [], total: 0, page: 1, totalPages: 0 }, "Empty query")
        );
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(Math.max(1, parseInt(limit, 10)), 50);
    const skip = (pageNum - 1) * limitNum;

    // Build the $search stage
    const searchStage = {
        $search: {
            index: "blog_search",
            compound: {
                must: [
                    {
                        text: {
                            query: query,
                            path: "title",
                            score: { boost: { value: 3 } },
                            multi: "basic"
                        }
                    }
                ],
                should: [
                    {
                        text: {
                            query: query,
                            path: "body",
                            score: { boost: { value: 1 } }
                        }
                    }
                ],
                filter: [
                    { equals: { path: "status", value: "published" } }
                ]
            },
            highlight: {
                path: ["title", "body"],
                maxNumPassages: { title: 1, body: 2 }
            }
        }
    };

    // Sort stage
    let sortStage;
    switch (sortBy) {
        case "recent":
            sortStage = { $sort: { createdAt: -1 } };
            break;
        case "popular":
            sortStage = { $sort: { views: -1, likes: -1 } };
            break;
        case "relevance":
        default:
            sortStage = { $sort: { score: { $meta: "textScore" } } };
            break;
    }

    // Build pipeline
    const pipeline = [
        searchStage,
        {
            $addFields: {
                score: { $meta: "searchScore" },
                titleHighlights: { $meta: "searchHighlights" }
            }
        },
        sortStage,
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "authorInfo"
            }
        },
        { $unwind: "$authorInfo" },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "categoryInfo"
            }
        },
        {
            $unwind: {
                path: "$categoryInfo",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "tags",
                localField: "tags",
                foreignField: "_id",
                as: "tagsInfo"
            }
        }
    ];

    // Faceted filtering
    if (category) {
        pipeline.push({
            $match: { "categoryInfo.slug": category }
        });
    }

    if (tag) {
        pipeline.push({
            $match: { "tagsInfo.slug": tag }
        });
    }

    // Count total before pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Blog.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(total / limitNum);

    // Add pagination and project
    pipeline.push(
        { $skip: skip },
        { $limit: limitNum },
        {
            $project: {
                title: 1,
                slug: 1,
                coverImage: 1,
                body: 1,
                views: 1,
                likes: 1,
                createdAt: 1,
                score: 1,
                titleHighlights: 1,
                author: {
                    _id: "$authorInfo._id",
                    fullName: "$authorInfo.fullName",
                    username: "$authorInfo.username",
                    avatar: "$authorInfo.avatar"
                },
                category: {
                    _id: "$categoryInfo._id",
                    name: "$categoryInfo.name",
                    slug: "$categoryInfo.slug"
                },
                tags: {
                    $map: {
                        input: "$tagsInfo",
                        as: "tag",
                        in: {
                            _id: "$$tag._id",
                            name: "$$tag.name",
                            slug: "$$tag.slug"
                        }
                    }
                }
            }
        }
    );

    const blogs = await Blog.aggregate(pipeline);

    // Extract highlighted snippets
    const results = blogs.map(blog => {
        const highlights = blog.titleHighlights || [];
        const titleHighlight = highlights.find(h => h.path === "title");
        const bodyHighlight = highlights.find(h => h.path === "body");

        // Strip HTML tags from body snippet for clean display
        const stripHtml = (html) => html?.replace(/<[^>]*>/g, '')?.trim() || '';

        return {
            ...blog,
            snippet: bodyHighlight
                ? stripHtml(bodyHighlight.texts?.map(t => t.value).join(''))
                : stripHtml(blog.body)?.substring(0, 200),
            matchedTitle: titleHighlight
                ? titleHighlight.texts?.map(t => t.value).join('')
                : blog.title
        };
    });

    return res.status(200).json(
        new ApiResponse(200, {
            blogs: results,
            total,
            page: pageNum,
            totalPages,
            query: query.trim()
        }, "Search results fetched successfully")
    );
});

// Facets endpoint — returns available categories and tags with counts
const getSearchFacets = asyncHandler(async (req, res) => {
    const { q: query } = req.query;

    if (!query || !query.trim()) {
        return res.status(200).json(
            new ApiResponse(200, { categories: [], tags: [] }, "Empty query")
        );
    }

    const facetPipeline = [
        {
            $search: {
                index: "blog_search",
                compound: {
                    must: [
                        {
                            text: {
                                query: query,
                                path: "title",
                                multi: "basic"
                            }
                        }
                    ],
                    should: [
                        {
                            text: {
                                query: query,
                                path: "body"
                            }
                        }
                    ],
                    filter: [
                        { equals: { path: "status", value: "published" } }
                    ]
                }
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "categoryInfo"
            }
        },
        { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "tags",
                localField: "tags",
                foreignField: "_id",
                as: "tagsInfo"
            }
        },
        {
            $facet: {
                categories: [
                    { $match: { "categoryInfo._id": { $ne: null } } },
                    { $group: { _id: "$categoryInfo._id", name: { $first: "$categoryInfo.name" }, slug: { $first: "$categoryInfo.slug" }, count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ],
                tags: [
                    { $unwind: { path: "$tagsInfo", preserveNullAndEmptyArrays: false } },
                    { $group: { _id: "$tagsInfo._id", name: { $first: "$tagsInfo.name" }, slug: { $first: "$tagsInfo.slug" }, count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]
            }
        }
    ];

    const [facetResult] = await Blog.aggregate(facetPipeline);

    return res.status(200).json(
        new ApiResponse(200, {
            categories: facetResult?.categories || [],
            tags: facetResult?.tags || []
        }, "Search facets fetched successfully")
    );
});

export { searchBlogs, getSearchFacets };
