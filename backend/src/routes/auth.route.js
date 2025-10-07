import express from "express"
import {login, logout, signup, updateProfile, checkAuth, updateLastSeen} from "../controllers/auth.controller.js";
import {protectRoute} from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", protectRoute, logout)
router.put("/update-profile", protectRoute, updateProfile) 
//we will not update alll the the user profile in the db but a specific one , so will use a middleware "protectRoute" for the same, a middleware is just a fn 

router.get("/check", protectRoute, checkAuth)
router.put("/update-last-seen", protectRoute, updateLastSeen)

export default router;

