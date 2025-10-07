import mongoose from "mongoose";

//mongoose automatically create a key "_id" whose value is unique for every entry in the collection
const userSchema = new mongoose.Schema( 
    {
        email:{
            type: String,
            required:true,
            unique:true,
        },
        fullName:{
            type: String,
            required: true,
        },
        password:{
            type:String,
            required:true,
            minlength:6,
        },
        profilePic:{
            type:String,
            default:"",
        },
        lastSeen: {
            type: Date,
            default: Date.now
        },
        isOnline: {
            type: Boolean,
            default: false
        },
    },{timestamps: true}  //"timestamps" Automatically add "createdAt" and "updatedAT" key which can be used by us for showing when the user has signup and when he last updated all the keys(user details)  
);

//mongoose.model("User", userSchema); this will make a colllection "users",
//naming convention of collection: mongoose wants singular collection name  and capitalized first letter, converts it into plural and lowercase (NOT A STRICT RULE)
const User = mongoose.model("User", userSchema);
export default User; //return the collection created 