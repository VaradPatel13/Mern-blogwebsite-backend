// src/api/v1/controllers/search.controller.js (UPDATED)

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";
import { User } from "../models/user.model.js";
import { Tag } from "../models/tag.model.js";
import mongoose from "mongoose";

const searchSite = asyncHandler(async (req, res) => {
    const { q: query } = req.query;

    if (!query) {
        return res.status(200).json(new ApiResponse(200, { blogs: [], users: [], tags: [] }, "Empty query"));
    }

    const regex = new RegExp(query, 'i'); // Case-insensitive search

    // We use Promise.all to run all searches in parallel for better performance
    const [blogs, users, tags] = await Promise.all([
        // --- THIS IS THE CORRECTED PART ---
        // Use an aggregation pipeline to populate and rename the author field
        Blog.aggregate([
            {
                $match: {
                    title: regex,
                    status: "published" // Only search published blogs
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "authorInfo"
                }
            },
            {
                $unwind: "$authorInfo" // Deconstruct the array from lookup
            },
            {
                $project: { // Reshape the output
                    title: 1,
                    slug: 1,
                    coverImage: 1,
                    createdAt: 1,
                    views: 1,
                    likes: 1,
                    body: 1,
                    // Rename the populated field to 'author'
                    author: {
                        _id: "$authorInfo._id",
                        fullName: "$authorInfo.fullName",
                        username: "$authorInfo.username",
                        avatar: "$authorInfo.avatar"
                    }
                }
            }
        ]),
        User.find({ fullName: regex }).select("fullName username avatar"),
        Tag.find({ name: regex })
    ]);

    const results = { blogs, users, tags };

    return res.status(200).json(new ApiResponse(200, results, "Search results fetched successfully"));
});

export { searchSite };
