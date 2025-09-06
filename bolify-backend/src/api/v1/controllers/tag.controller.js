// src/api/v1/controllers/tag.controller.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tag } from "../models/tag.model.js";
import { Blog } from "../models/blog.model.js";

const slugify = (text) => text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

const createTag = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        throw new ApiError(400, "Tag name is required");
    }

    const slug = slugify(name);
    const existingTag = await Tag.findOne({ slug });

    if (existingTag) {
        throw new ApiError(409, "Tag with this name already exists");
    }

    const tag = await Tag.create({ name, slug });
    return res.status(201).json(new ApiResponse(201, tag, "Tag created successfully"));
});

const getAllTags = asyncHandler(async (req, res) => {
    const tags = await Tag.find({});
    return res.status(200).json(new ApiResponse(200, tags, "Tags fetched successfully"));
});

const getBlogsByTag = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const tag = await Tag.findOne({ slug });

    if (!tag) {
        throw new ApiError(404, "Tag not found");
    }

    const blogs = await Blog.find({ tags: tag._id, status: "published" }).populate("createdBy", "fullName username avatar");
    return res.status(200).json(new ApiResponse(200, blogs, `Blogs for tag '${tag.name}' fetched successfully`));
});
const updateTag = asyncHandler(async (req, res) => {
    const { tagId } = req.params;
    const { name } = req.body;
    if (!name) {
        throw new ApiError(400, "Tag name is required for update.");
    }
    const slug = slugify(name);
    const updatedTag = await Tag.findByIdAndUpdate(tagId, { name, slug }, { new: true });
    if (!updatedTag) {
        throw new ApiError(404, "Tag not found.");
    }
    return res.status(200).json(new ApiResponse(200, updatedTag, "Tag updated successfully."));
});

const deleteTag = asyncHandler(async (req, res) => {
    const { tagId } = req.params;
    const tag = await Tag.findByIdAndDelete(tagId);
    if (!tag) {
        throw new ApiError(404, "Tag not found.");
    }
    // Optional: Remove this tag from all blogs that use it
    await Blog.updateMany({ tags: tagId }, { $pull: { tags: tagId } });
    return res.status(200).json(new ApiResponse(200, {}, "Tag deleted successfully."));
});

export { createTag, getAllTags, getBlogsByTag, updateTag, deleteTag };