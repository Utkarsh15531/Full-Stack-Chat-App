import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/", 
    // baseURL: import.meta.env.MODE === "development" ? "http://192.170.11.50:5001/api" : "/", //base url of backend
    withCredentials: true,
});