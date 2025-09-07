// src/app.js 

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routerV1 from "./api/v1/routes/index.js";
import { errorHandler } from "./api/v1/middlewares/error.middleware.js";
import morgan from "morgan";


const app = express();

// --- Middleware Configuration ---
app.use(morgan('dev')); 

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mern-blogwebsite-frontend.vercel.app/"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// --- Routes ---
app.use("/api/v1", routerV1);

// Health Check Endpoint
app.use("/", (req, res) => {
    res.send("Welcome to Bolify Backend!");
});

// --- Global Error Handler ---
app.use(errorHandler);

export { app };
