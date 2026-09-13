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
    const searchRegex = new RegExp(query.trim(), "i");

    const matchStage = {
        status: "published",
        $or: [
            { title: searchRegex },
            { body: searchRegex }
        ]
    };

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
            sortStage = { $sort: { createdAt: -1 } };
            break;
    }

    const pipeline = [
        { $match: matchStage },
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

    if (category) {
        pipeline.push({ $match: { "categoryInfo.slug": category } });
    }

    if (tag) {
        pipeline.push({ $match: { "tagsInfo.slug": tag } });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Blog.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(total / limitNum);

    pipeline.push(
        sortStage,
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

    const stripHtml = (html) => html?.replace(/<[^>]*>/g, '')?.trim() || '';

    const results = blogs.map(blog => ({
        ...blog,
        snippet: stripHtml(blog.body)?.substring(0, 200),
        matchedTitle: blog.title
    }));

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

const getSearchFacets = asyncHandler(async (req, res) => {
    const { q: query } = req.query;

    if (!query || !query.trim()) {
        return res.status(200).json(
            new ApiResponse(200, { categories: [], tags: [] }, "Empty query")
        );
    }

    const searchRegex = new RegExp(query.trim(), "i");

    const facetPipeline = [
        {
            $match: {
                status: "published",
                $or: [
                    { title: searchRegex },
                    { body: searchRegex }
                ]
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
