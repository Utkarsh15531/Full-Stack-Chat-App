import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"

export const signup = async(req, res)=>{
    const {fullName, email, password} = req.body;
    try{
        if(!fullName || !email || !password){
            return res.status(400).json({message: "All field are required" });
        }
        if(password.length < 6){
            return res.status(400).json({message: "password must be at least 6 charcters" });
        }

        const user = await User.findOne({email});
        if(user) return res.status(400).json({message:"Email already exists"}); // statusCode 400 means bad request
        
        //hash password
        const salt = await bcrypt.genSalt(10);  //10 is the cost factor, also known as the salt rounds. more the salt rounde more secure, but slow 
        const hashedPassword = await bcrypt.hash(password, salt) //salt is a random string generated to make hasspassword unique even if two users have the same password as salt for them will be different 

        const newUser = new User({
            fullName, //fullName: fullName, key name in Schema "User" is fullname and fulname is the value we r passing in it
            email,    //email:email
            password: hashedPassword
        })

        if(newUser){
            //generate jwt token here
            generateToken(newUser._id, res) //userid is stored in the key '_id' by default, we can see it in our collection in mongodb or on the thunder client too
            await newUser.save();
            
            // statusCode 201 means created , used to indicate When a new resource is created (e.g., user, blog, order)
            res.status(201).json({
                _id:newUser._id,
                fullName: newUser.fullName,
                email:newUser.email,
                profilePic:newUser.profilePic,
            });
        }else{
            // statusCode 400 means bad request, indicate data send by client is invalid/incorrect, e.g invalid username , invalid password
            res.status(400).json({message: "Invalid user"});
        }

    }catch (error){
        console.log("Error in signup controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
};

export const login = async(req, res)=>{
    const {email, password} = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({email})

        if(!user){
            return res.status(400).json({message: "Invalid credentials"})  //we r not specifying wether the entered email is wrong or password is wrong, so that if any malicios user is trying, he/she does not know exactly what creddential is wrong and become hard to use other's account    
        }

        //bcrypt.compare will hash the "password" and then comapre to "user.password" stored in db
        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if(!isPasswordCorrect){
            return res.status(400).json({message: "Invalid credentials"})
        }

        generateToken(user._id, res) //generates token on each login

        //statusCode 200 means OK, used to indicate Successful GET, PUT, PATCH, DELETE, or non-creation POST
        res.status(200).json({
            _id:user._id,
            fullName: user.fullName,
            email:user.email,
            profilePic:user.profilePic,
        })

    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({message:"Internal Server error"});
    }
};

export const logout = (req, res)=>{
    try {
        //res.cookie("cookieName", "token", {options})
        res.cookie("jwt", "", {maxAge:0}) //clearing out cookie, maxAge:0 expires the cookie at the instant 
        res.status(200).json({message: "Logged out successfully"});
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({message:"Internal Server error"});
    }
};

//we r just giving feature to update profile pic only neither email nor fullName
export const updateProfile = async(req, res)=>{
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;

        if(!profilePic){
            return res.status(400).json({message: "Profile pic is required"});
        }

        //Cloudinary is not our db here it is just used as bucket to store images
        const uploadResponse = await cloudinary.uploader.upload(profilePic)
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic:uploadResponse.secure_url}, {new:true});

        res.status(200).json(updatedUser);

    } catch (error) {
        console.log("error in update profile: ", error);
        res.status(500).json({message:"Internal server error"});
    }
}

//to check api dealing with image where we have used cloudinary to store pictures
//go thunder client, use required api and method 
//In body { profilePic: "Base64 correspondin gto your image"}, here "profilePic" should be same as the field defined in userSchema to store the image
//do get base64 corresponding to your img just upload ur pic on "https://www.base64-image.de/" 
//Base64 is a way to encode binary data (like images, files) into a text format that can be safely sent over the internet (like in JSON, HTTP, etc).

//we will use this fn when user refresh the website
export const checkAuth = (req, res)=>{
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({message: "Internal Server error"});
    }
}
