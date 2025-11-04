import axios from "axios";

export const axiosInstance = axios.create({
    // baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/", 

    //For production. Deployment on Render
    baseURL: import.meta.env.MODE === "development" ? `${import.meta.env.VITE_BASE_URL}/api` : "/",
    
    withCredentials: true,
});