// src/api/v1/models/category.model.js

import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
    },
}, { timestamps: true });

export const Category = mongoose.model("Category", categorySchema);