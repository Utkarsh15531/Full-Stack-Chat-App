import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User", //reference to "UserSchema" as two user will do chat
            required:true,
        },
        receiverId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",  //reference to "UserSchema"
            required: true,
        },
        //user can send either send text or img or both so we dont use required:true in text and image field
        text:{
            type:String,
        },
        image:{
            type:String,
        },
    },{timestamps: true}  //"timestamps" Automatically add "createdAt" and "updatedAT" key which can be used bu us for showing when the user has signup and when he last updated all the keys(user details)  
);

//mongoose.model("Message", messageSchema); will create/resuse a collection of name "messages" and return the Message model
const Message = mongoose.model("Message", messageSchema);

export default Message;








