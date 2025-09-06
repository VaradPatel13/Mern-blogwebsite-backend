import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Blog } from "../models/blog.model.js";
import { Comment } from "../models/comment.model.js";

const deleteUserByAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    // TODO: Also delete user's blogs, comments, and avatar from ImageKit
    await user.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "User deleted successfully by admin."));
});

const deleteBlogByAdmin = asyncHandler(async (req, res) => {
    const { blogId } = req.params;
    const blog = await Blog.findById(blogId);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }
    // TODO: Also delete blog's cover image from ImageKit
    await blog.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "Blog deleted successfully by admin."));
});

const deleteCommentByAdmin = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    await comment.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully by admin."));
});

/**
 * @description Get a paginated list of all users on the platform.
 * @route GET /api/v1/admin/users
 */
const getAllUsersByAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const users = await User.aggregatePaginate(
        User.aggregate([
            {
                $project: {
                    password: 0,
                    refreshToken: 0,
                },
            },
        ]),
        { page: parseInt(page), limit: parseInt(limit) }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, users, "All users fetched successfully by admin."));
});

export { deleteUserByAdmin, deleteBlogByAdmin, deleteCommentByAdmin, getAllUsersByAdmin };
