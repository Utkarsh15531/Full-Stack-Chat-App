import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

//for deployment, this configuration has been done 
import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve(); //this also done for deployment

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

//for production we will make dist folder as an static asset
if (process.env.NODE_ENV === "production") { //This checks if your app is running in "production" mode (i.e., you’ve deployed it, not just running locally for development).
    //express.static tells Express to serve static files (HTML, CSS, JS, images) from your frontend’s build folder.
    //Usually, when you build your React/Vue/Angular app, the output goes to frontend/dist.
    app.use(express.static(path.join(__dirname, "../frontend/dist"))); //static is inuilt middleware fn in express, serves static files

    // '*' represent any file````````````````
    app.get("*", (req, res) => {
        //Example: If a user visits /profile (other than static file), the server still returns index.html, and the frontend JS handles the route.
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}

server.listen(PORT, () => {
    console.log("server is running on PORT:" + PORT);
    connectDB();
});

/*you want one server to handle both your API requests (e.g., /api/messages) and serve your frontend app.
This makes deployment easier: you only need to deploy and run one server process 

*/