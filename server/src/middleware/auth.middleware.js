import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async(req, res, next)=>{
    try {
        //            req.cookie.cookiesName
        const token = req.cookies.jwt

        if(!token){
            return res.status(401).json({message: "Unauthurized - NO token Provided"});
        }
        
        //It verifies a JWT (JSON Web Token) using the secret key that was originally used to sign it.
        //t also decodes the token and gives you the original payload (like userId, etc.).
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if(!decoded){
            return res.status(401).json({message: "Unauthurized - Invalild token"});
        }

        //we r finding required user and sending all that user details except password
        const user = await User.findOne({_id: decoded.userId}).select("-password");
        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        req.user = user;
        next();

    } catch (error) {
        console.log("Error in ProtectROute middleware: ", error.message);
        res.status(500).json({message: "Internal Error"})
    }
}