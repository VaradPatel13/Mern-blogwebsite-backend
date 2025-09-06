// src/api/v1/controllers/blog.controller.js (UPDATED)

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";
import imagekit from "../utils/imagekit.js";
import mongoose from "mongoose";

// --- Keep existing functions: createBlog, getBlogBySlug, updateBlog, deleteBlog, getAllBlogs ---
// ... (code from previous step)

/**
 * @description Create a new blog post
 * @route POST /api/v1/blogs
 */
const createBlog = asyncHandler(async (req, res) => {
    const { title, body, category, tags } = req.body;

    if (!title || !body) {
        throw new ApiError(400, "Title and body are required.");
    }

    let coverImageUrl = "https://ik.imagekit.io/your_imagekit_id/default-blog-cover.png";
    let coverImageFileId = null;

    if (req.file) {
        try {
            const uploadedImage = await imagekit.upload({
                file: req.file.buffer,
                fileName: `blog_cover_${req.user._id}_${Date.now()}`,
                folder: "bolify/blogs",
            });
            coverImageUrl = uploadedImage.url;
            coverImageFileId = uploadedImage.fileId;
        } catch (error) {
            throw new ApiError(500, "Failed to upload cover image to ImageKit");
        }
    }

    const blog = await Blog.create({
        title,
        body,
        coverImage: coverImageUrl, // from image upload logic
        coverImageFileId, // from image upload logic
        createdBy: req.user._id,
        category, // Assign category
        tags, // Assign tags
    });

    return res
        .status(201)
        .json(new ApiResponse(201, blog, "Blog post created successfully as a draft."));
});


/**
 * @description Get a single published blog post by its slug
 * @route GET /api/v1/blogs/:slug
 */
const getBlogBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const blog = await Blog.findOneAndUpdate(
        { slug, status: "published" },
        { $inc: { views: 1 } },
        { new: true }
    ).populate("createdBy", "fullName username avatar")
    //  .populate("comments.user", "fullName username avatar"); // Also populate comment authors

    if (!blog) {
        throw new ApiError(404, "Blog post not found or not published.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, blog, "Blog post fetched successfully."));
});

/**
 * @description Update a blog post
 * @route PUT /api/v1/blogs/:id
 */
const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, body, status, category, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid blog ID format.");
    }

    const blog = await Blog.findById(id);

    if (!blog) {
        throw new ApiError(404, "Blog not found.");
    }

    if (blog.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post.");
    }

    if (title) blog.title = title;
    if (body) blog.body = body;
    if (status && ["draft", "published"].includes(status)) {
        blog.status = status;
    }
    if (category) blog.category = category; // Update category
    if (tags) blog.tags = tags; // Update tags


    if (req.file) {
        if (blog.coverImageFileId) {
            await imagekit.deleteFile(blog.coverImageFileId).catch(err => console.error("Failed to delete old image:", err));
        }
        const uploadedImage = await imagekit.upload({
            file: req.file.buffer,
            fileName: `blog_cover_${req.user._id}_${Date.now()}`,
            folder: "bolify/blogs",
        });
        blog.coverImage = uploadedImage.url;
        blog.coverImageFileId = uploadedImage.fileId;

    }

    await blog.save({ validateBeforeSave: true });

    return res
        .status(200)
        .json(new ApiResponse(200, blog, "Blog post updated successfully."));
});

/**
 * @description Delete a blog post
 * @route DELETE /api/v1/blogs/:id
 */
const deleteBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid blog ID format.");
    }

    const blog = await Blog.findById(id);

    if (!blog) {
        throw new ApiError(404, "Blog not found.");
    }

    if (blog.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this post.");
    }

    if (blog.coverImageFileId) {
        await imagekit.deleteFile(blog.coverImageFileId).catch(err => console.error("Failed to delete image from ImageKit:", err));
    }

    await blog.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Blog post deleted successfully."));
});

/**
 * @description Get a paginated list of all published blogs
 * @route GET /api/v1/blogs
 */
const getAllBlogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
    };

    const aggregation = Blog.aggregate([
        { $match: { status: "published" } },
        { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "authorDetails" } },
        { $unwind: "$authorDetails" },
        {
            $project: {
                title: 1,
                slug: 1,
                coverImage: 1,
                views: 1,
                likes: 1,
                createdAt: 1,
                "author.username": "$authorDetails.username",
                "author.fullName": "$authorDetails.fullName",
                "author.avatar": "$authorDetails.avatar",
            },
        },
    ]);

    const blogs = await Blog.aggregatePaginate(aggregation, options);

    return res
        .status(200)
        .json(new ApiResponse(200, blogs, "Blogs fetched successfully."));
});


// --- NEW FUNCTIONS ---

/**
 * @description Toggle a like on a blog post
 * @route PATCH /api/v1/blogs/:id/like
 */
const toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid blog ID.");
    }

    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, "Blog not found.");
    }

    const isLiked = blog.likedBy.includes(userId);

    const updateOperation = isLiked
        ? { $pull: { likedBy: userId }, $inc: { likes: -1 } }
        : { $addToSet: { likedBy: userId }, $inc: { likes: 1 } };

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateOperation, { new: true });

    return res.status(200).json(
        new ApiResponse(
            200,
            { likes: updatedBlog.likes, isLiked: !isLiked },
            isLiked ? "Unliked successfully" : "Liked successfully"
        )
    );
});

/**
 * @description Add a comment to a blog post
 * @route POST /api/v1/blogs/:id/comments
 */
const addComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text?.trim()) {
        throw new ApiError(400, "Comment text is required.");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid blog ID.");
    }

    const newComment = { text, user: userId };

    const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        { $push: { comments: newComment } },
        { new: true }
    ).populate("comments.user", "fullName username avatar");

    if (!updatedBlog) {
        throw new ApiError(404, "Blog not found.");
    }

    const addedComment = updatedBlog.comments[updatedBlog.comments.length - 1];

    return res.status(201).json(
        new ApiResponse(201, addedComment, "Comment added successfully.")
    );
});

/**
 * @description Get all blogs (drafts and published) for the logged-in user.
 * @route GET /api/v1/users/me/blogs
 */
const getMyBlogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const blogs = await Blog.aggregatePaginate(
        Blog.aggregate([
            {
                $match: {
                    createdBy: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    status: 1,
                    coverImage: 1,
                    createdAt: 1,
                    views: 1,
                    likes: 1,
                }
            }
        ]),
        { page: parseInt(page), limit: parseInt(limit) }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, blogs, "User's blogs fetched successfully"));
});

const getBlogById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, "Blog not found.");
    }
    return res.status(200).json(new ApiResponse(200, blog, "Blog fetched successfully."));
});


// GET /api/v1/blogs/user/:userId
const getBlogsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    console.log("Fetching blogs created by user:", userId);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user id format.");
    }

    // Find blogs created by this user
    const blogs = await Blog.find({ createdBy: userId })
        .populate("createdBy", "fullName username avatar email")
        .sort({ createdAt: -1 });

    if (!blogs || blogs.length === 0) {
        throw new ApiError(404, "No blogs found for this user.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, blogs, "Blogs fetched successfully."));
});


export {
    createBlog,
    getBlogBySlug,
    updateBlog,
    deleteBlog,
    getAllBlogs,
    toggleLike,
    addComment,
    getMyBlogs,
    getBlogById,
    getBlogsByUser
};
