// src/index.js

import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config({
    path: './.env'
});

// Now, import the rest of your application modules
import connectDB from "./config/database.js";
import { app } from "./app.js";


const PORT = process.env.PORT || 8000;

// Connect to the database and then start the server
connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("ERROR after DB connection: ", error);
        throw error;
    });

    app.listen(PORT, () => {
        console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.log("MONGO DB connection failed !!! ", err);
});