// src/app.js (UPDATED)

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routerV1 from "./api/v1/routes/index.js";
import { errorHandler } from "./api/v1/middlewares/error.middleware.js";
import morgan from "morgan";


const app = express();

// --- Middleware Configuration ---
app.use(morgan('dev')); // 2. Use morgan for logging
app.use(cors({
    origin:"http://localhost:5173",
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
// --- Routes ---
app.use("/api/v1", routerV1);

// --- Global Error Handler ---
// This must be the last middleware
app.use(errorHandler);

export { app };
