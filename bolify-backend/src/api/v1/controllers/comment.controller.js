
// src/api/v1/controllers/comment.controller.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Blog } from "../models/blog.model.js";
import mongoose from "mongoose";

const createComment = asyncHandler(async (req, res) => {
    const { blogId } = req.params;
    const { text } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    const comment = await Comment.create({
        text,
        blog: blogId,
        owner: req.user._id,
    });

    const createdComment = await Comment.findById(comment._id).populate("owner", "fullName username avatar");

    return res.status(201).json(new ApiResponse(201, createdComment, "Comment added successfully"));
});

const getBlogComments = asyncHandler(async (req, res) => {
    const { blogId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const blog = await Blog.findById(blogId);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                blog: new mongoose.Types.ObjectId(blogId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                text: 1,
                createdAt: 1,
                "owner.fullName": "$owner.fullName",
                "owner.username": "$owner.username",
                "owner.avatar": "$owner.avatar",
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const comments = await Comment.aggregatePaginate(commentsAggregate, options);

    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    comment.text = text;
    await comment.save();
    
    const updatedComment = await Comment.findById(commentId).populate("owner", "fullName username avatar");

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await comment.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { createComment, getBlogComments, updateComment, deleteComment };
