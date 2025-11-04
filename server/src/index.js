import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

//for deployment, this configuration has been done 
import path from "path";
import { fileURLToPath } from "url";



import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve(); //this also done for deployment

//for deployment, this configuration has been done 
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, '/client/dist'))); //use the client app
// app.get('*', (req, res) => 
//   res.sendFile(path.join(__dirname, '/client/dist/index.html'))
// );




app.use(express.json({ limit: '50mb' })); //the size limit fixed the voice msg sent error
app.use(express.urlencoded({ extended: true, limit: '50mb' }));  //added later which also helped inresolving voice msg error

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
// if (process.env.NODE_ENV === "production") { //This checks if your app is running in "production" mode (i.e., you’ve deployed it, not just running locally for development).
//     //express.static tells Express to serve static files (HTML, CSS, JS, images) from your frontend’s build folder.
//     //Usually, when you build your React/Vue/Angular app, the output goes to frontend/dist.
//     app.use(express.static(path.join(__dirname, "./client/dist"))); //static is inuilt middleware fn in express, serves static files

//     // '*' represent any file````````````````
//     app.get("*", (req, res) => {
//         //Example: If a user visits /profile (other than static file), the server still returns index.html, and the frontend JS handles the route.
//         res.sendFile(path.join(__dirname, "./client", "dist", "index.html"));
//     });
// }

// Server Binding: By default, some development servers (especially for the backend) might only bind to localhost 
// (the 127.0.0.1 address), which means they only listen for connections from the same machine. You need to ensure 
// your server is bound to 0.0.0.0, which means it will listen on all available network interfaces, including your 
// local network's IPv4 address.

server.listen(PORT, '0.0.0.0',() => {
    console.log("server is running on PORT:" + PORT);
    connectDB();
});

/*you want one server to handle both your API requests (e.g., /api/messages) and serve your frontend app.
This makes deployment easier: you only need to deploy and run one server process 

*/