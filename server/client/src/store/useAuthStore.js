import {create} from 'zustand'
import { axiosInstance } from "../lib/axios.js";
import toast from 'react-hot-toast';
import {io} from "socket.io-client";

//backend url
// const BASE_URL= "http://localhost:5001"

//for production, deployed on Render
const BASE_URL= import.meta.env.VITE_BASE_URL;


//we will have bunch of different loading states
export const useAuthStore = create((set, get)=>({ 
    //with the help of get method i can access these state and fn in different fn
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    //whenever we login or signup or checkAuth (basically as soon as we authenticate, or new user ocmes online) we connect that user's socket for real time chat that is why we r using connectSocket fn in these three fn
    checkAuth: async()=>{
        try {
            //we r not using complete url bcz we have stored http://localhost:5001/api in the baseUrl in axiosInstance fn defined in axios.js in lib folder
            const res = await axiosInstance.get("/auth/check") //this is a api defined in backend, so using axios to connect 
       
            set({authUser:res.data})
            get().connectSocket() // if authenticated then userr is logged in, so we should connect to socket
        } catch (error) {
            console.log("Error in checkAuth:", error);
            set({authUser:null})
        }finally{
            set({isCheckingAuth:false})
        }
    },

    signup: async(data) =>{
        set({isSigningUp: true});
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({authUser: res.data});
            toast.success("Account created successfully");

            get().connectSocket(); //as we signup we get logged in too, so connectSocket will show that user is online
        } catch (error) {
            toast.error(error.response.data.message);
        } finally{
            set({isSigningUp: false});
        }
    },

    login: async(data) =>{
        set({isLoggingIn: true});
        try{
            const res = await axiosInstance.post("/auth/login", data);
            set({authUser : res.data});
            toast.success("Logged in successfully");

            get().connectSocket(); //with the help of get methos we r accessing connectSocket fn
            
            setTimeout(() => {
            const onlineUsers = get().onlineUsers;
            console.log("Online users after login:");
            onlineUsers.forEach(userId => {
                console.log(userId);
            });
        }, 1000); // 1 second delay
        
        }catch (error) {
            toast.error(error.response.data.message); //error from backend
        }finally{
            set({isLoggingIn: false})
        }
    },

    //we r not defining state like isLoggingOut, loggingOut is very fast functionality
    //when user is offline, logout or closes the tab of our web app user should be disconnected from socket so using disconnectSocket fn in logout fn
    logout: async()=>{
        try {
            await axiosInstance.post("auth/logout");
            set({authUser:null});
            toast.success("Logged out successfully");
           
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message); //error getting from backend
        }
    },

    updateProfile: async(data) =>{
        set({isUpdatingProfile: true});
        try {
            const res =  await axiosInstance.put("/auth/update-profile", data);
            set({authUser: res.data})
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile: ", error);
            toast.error(error.response.data.message);
        }finally{
            set({isUpdatingProfile: false});
        }
    },

    connectSocket: () => {
        //checking user is authhenticated or not and also checking if connection already estabilished 
        const {authUser} = get(); //authUser is a state defined at top
        if(!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL,{
            query:{
                userId: authUser._id,
            },
            withCredentials: true, //done for deploymment on Render
        });
        socket.connect()
        

        set({ socket: socket });

        //"getOnlineUsers" -> eventname used in socket.on here should be same as eventname used in io.emit in socket.js in backend
        //whatever io.emit is emitting in backend , we will get the same here as props(userId), like our in backend in socket.js file we r emmittng a map which have stored a mapping of userid(key) and socketId(value), we can name our prop passed in callback fn anything
        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds });
            setTimeout(() => {
            const onlineUsers = get().onlineUsers;
            console.log("Online users after login:");
            onlineUsers.forEach(userId => {
                console.log(userId);
            });
        }, 1000); // 1 second delay
        });
    },


    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
    }




    /*What Socket.IO Does on the Frontend?
      1. Real-time updates	: Chat messages, notifications, live scores, etc., appear instantly.
      2. Bidirectional communication: Both client and server can send/receive data anytime (not just client → server).
`     3. Persistent connection : Keeps a WebSocket connection alive (falls back to HTTP if needed).
      4 Event-based communication : 	You can emit and listen to custom events (e.g., 'message', 'typing'). emit: You're announcing something happened and sending data with it/ Send an event and data, on: Listen for an event */


}));