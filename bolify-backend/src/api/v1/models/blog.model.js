// src/api/v1/models/blog.model.js (UPDATED)

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// A simple function to generate a URL-friendly slug from a string
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')       // Replace spaces with -
        .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
        .replace(/\-\-+/g, '-')     // Replace multiple - with single -
        .replace(/^-+/, '')         // Trim - from start of text
        .replace(/-+$/, '');        // Trim - from end of text
};

// Define an embedded schema for comments
const commentSchema = new Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const blogSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
        },
        body: {
            type: String, // Will contain HTML content from a rich text editor
            required: true,
        },
        coverImage: {
            type: String, // URL from ImageKit
            required: true,
            default: "https://ik.imagekit.io/your_imagekit_id/default-blog-cover.png"
        },
        coverImageFileId: {
            type: String, // To store the fileId for easy deletion from ImageKit
        },
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft",
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        likes: {
            type: Number,
            default: 0,
        },
        likedBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        tags: [
            {
                type: Schema.Types.ObjectId,
                ref: "Tag",
            },
        ],
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to generate slug from title before saving
blogSchema.pre("validate", function (next) {
    if (this.isModified("title")) {
        this.slug = slugify(this.title) + '-' + Date.now(); // Add timestamp for uniqueness
    }
    next();
});

// Add the pagination plugin
blogSchema.plugin(mongooseAggregatePaginate);

export const Blog = mongoose.model("Blog", blogSchema);