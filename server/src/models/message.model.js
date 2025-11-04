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
        voiceMessage: {
            type: String, // base64 encoded audio data or URL
        },
        voiceDuration: {
            type: Number, // duration in seconds
            default: 0
        },
        status: {
            type: String,
            enum: ['sending', 'sent', 'delivered', 'read'],
            default: 'sent'
        },
        // New fields for enhanced features
        reactions: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            emoji: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        editedAt: {
            type: Date,
            default: null
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        readBy: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            readAt: {
                type: Date,
                default: Date.now
            }
        }],
        isDeleted: {
            type: Boolean,
            default: false
        }
    },{timestamps: true}  //"timestamps" Automatically add "createdAt" and "updatedAT" key which can be used by us for showing when the user has signup and when he last updated all the keys(user details)
);

//mongoose.model("Message", messageSchema); will create/resuse a collection of name "messages" and return the Message model
const Message = mongoose.model("Message", messageSchema);

export default Message;








