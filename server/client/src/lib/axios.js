import axios from "axios";

// This checks if the VITE_BASE_URL (set on Render) exists.
// If it exists, use it and append the '/api' prefix.
// If it does NOT exist (local dev), fall back to http://localhost:5001/api.
const API_BASE_URL = import.meta.env.VITE_BASE_URL 
    ? `${import.meta.env.VITE_BASE_URL}/api` 
    : "http://localhost:5001/api";

export const axiosInstance = axios.create({
    // Use the dynamically determined base URL for all API requests
    baseURL: API_BASE_URL, 
    withCredentials: true,
});