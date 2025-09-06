// src/api/v1/models/tag.model.js

import mongoose, { Schema } from "mongoose";

const tagSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
    },
}, { timestamps: true });

export const Tag = mongoose.model("Tag", tagSchema);