// src/api/v1/middlewares/multer.middleware.js

import multer from "multer";

// Configure multer to use memory storage.
// This stores the file in a buffer in memory, which is efficient
// for passing directly to a cloud upload service like ImageKit.
const storage = multer.memoryStorage();

export const upload = multer({
    storage,
});
