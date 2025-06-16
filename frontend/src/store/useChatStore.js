import {create} from "zustand"  //zustand is scalable global state management library for React
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`); //connecting to backend, and passing dynamic params as per this api requirement
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sentMessage: async(messageData) =>{
    //we can't access the array "messages" defined above directly writing "messages", use get. Smae for "selectedUser"
    const {selectedUser, messages} = get()
    try {
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData); //connecting with backend api
        set({messages:[...messages, res.data]})
    } catch (error) {
        toast.error(error.response.data.message);
    }
  },

  //
  subscribeToMessages: ()=>{
    const {selectedUser} = get()
    if(!selectedUser) return;
    
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) =>{
      /* todo: optimized: without this line f1 send me msg but i have opened chat of f2(this should not happen), the msg sent by f1 appears in f2 chat, after reclicking on f2 it disappear */
      if(newMessage.senderId !== selectedUser._id) return;
      
      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  //when we close the window or log out
  unsubscribeFromMessages: ()=>{
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({selectedUser}), //this fn will be called in other file through which required user will be passed and that user will be selected for the chat
}));

//basic structure of "create" from zustand
//  const useStore = create((set) => ({
//   // state
//   count: 0,

//   // actions
//   increment: () => set((state) => ({ count: state.count + 1 })),
//   decrement: () => set((state) => ({ count: state.count - 1 })),
// }));
