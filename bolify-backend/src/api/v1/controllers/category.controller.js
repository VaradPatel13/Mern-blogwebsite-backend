// src/api/v1/controllers/category.controller.js (NEW FILE)
import mongoose from "mongoose";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";
import { Blog } from "../models/blog.model.js";

const slugify = (text) => text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

const createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        throw new ApiError(400, "Category name is required");
    }

    const slug = slugify(name);
    const existingCategory = await Category.findOne({ slug });

    if (existingCategory) {
        throw new ApiError(409, "Category with this name already exists");
    }

    const category = await Category.create({ name, slug });
    return res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
});

const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({});
    return res.status(200).json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

const getBlogsByCategory = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const category = await Category.findOne({ slug });

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Use aggregation to populate and rename the author field for consistency
    const blogs = await Blog.aggregate([
        {
            $match: {
                category: new mongoose.Types.ObjectId(category._id),
                status: "published"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "authorDetails"
            }
        },
        {
            $unwind: "$authorDetails"
        },
        {
            $project: {
                // Include all original blog fields you need
                title: 1,
                slug: 1,
                body: 1,
                coverImage: 1,
                status: 1,
                views: 1,
                likes: 1,
                createdAt: 1,
                // Rename createdBy's data into a new 'author' object
                author: {
                    _id: "$authorDetails._id",
                    fullName: "$authorDetails.fullName",
                    username: "$authorDetails.username",
                    avatar: "$authorDetails.avatar"
                }
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, blogs, `Blogs for category '${category.name}' fetched successfully`));
});


const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { name } = req.body;
    if (!name) {
        throw new ApiError(400, "Category name is required for update.");
    }
    const slug = slugify(name);
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, { name, slug }, { new: true });
    if (!updatedCategory) {
        throw new ApiError(404, "Category not found.");
    }
    return res.status(200).json(new ApiResponse(200, updatedCategory, "Category updated successfully."));
});

const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
        throw new ApiError(404, "Category not found.");
    }
    // Optional: Set category to null for all blogs that use it
    await Blog.updateMany({ category: categoryId }, { $set: { category: null } });
    return res.status(200).json(new ApiResponse(200, {}, "Category deleted successfully."));
});

export { createCategory, getAllCategories, getBlogsByCategory, updateCategory, deleteCategory };

