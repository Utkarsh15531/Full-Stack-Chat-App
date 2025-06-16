//this file helps us to connect ot the database
import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

export const connectDB = async()=>{
    try{
        const conn = await mongoose.connect(process.env.MONGODB_URL)
        console.log("Mongo DB connected");
    }catch(error){
        console.log("Mongo DB connection error: ", error);
    }
};