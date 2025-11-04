import {create} from "zustand"  //zustand is scalable global state management library for React
import { toast } from "react-hot-toast"
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  // New states for enhanced features
  replyingTo: null,
  editingMessage: null,
  typingUsers: {},
  searchQuery: "",
  searchResults: [],
  currentSearchIndex: 0,
  highlightedMessageId: null,
  unreadCounts: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
      
      // Also fetch unread counts
      const unreadRes = await axiosInstance.get("/messages/unread/counts");
      set({ unreadCounts: unreadRes.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
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
    
    // Create optimistic message with 'sending' status
    const authUser = useAuthStore.getState().authUser;
    const optimisticMessage = {
      _id: Date.now().toString(), // temporary ID
      senderId: authUser?._id,
      receiverId: selectedUser._id,
      ...messageData,
      status: 'sending',
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    // Add optimistic message immediately
    set({messages:[...messages, optimisticMessage]})
    
    try {
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData); //connecting with backend api
        
        // Replace optimistic message with real message
        set(state => ({
          messages: state.messages.map(msg => 
            msg.isOptimistic && msg._id === optimisticMessage._id 
              ? { ...res.data, status: 'sent' }
              : msg
          )
        }));
        
        // Simulate delivery status after a short delay
        setTimeout(() => {
          set(state => ({
            messages: state.messages.map(msg => 
              msg._id === res.data._id && msg.status === 'sent'
                ? { ...msg, status: 'delivered' }
                : msg
            )
          }));
        }, 1000);
        
    } catch (error) {
        // Remove failed optimistic message and show error
        set(state => ({
          messages: state.messages.filter(msg => msg._id !== optimisticMessage._id)
        }));
        toast.error(error.response?.data?.message || 'Failed to send message');
    }
  },

  //
  subscribeToMessages: ()=>{
    const {selectedUser} = get()
    if(!selectedUser) return;
    
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) =>{
      const { selectedUser, unreadCounts } = get();
      /* todo: optimized: without this line f1 send me msg but i have opened chat of f2(this should not happen), the msg sent by f1 appears in f2 chat, after reclicking on f2 it disappear */
      if(newMessage.senderId !== selectedUser._id) {
        // Update unread count for this sender
        set({
          unreadCounts: {
            ...unreadCounts,
            [newMessage.senderId]: (unreadCounts[newMessage.senderId] || 0) + 1
          }
        });
        return;
      }
      
      // Check if we already have this message (from optimistic update)
      const currentMessages = get().messages;
      const existingMessage = currentMessages.find(msg => msg._id === newMessage._id);
      
      if (existingMessage) {
        // Update existing message
        set({
          messages: currentMessages.map(msg => 
            msg._id === newMessage._id ? { ...newMessage, status: 'delivered' } : msg
          )
        });
      } else {
        // Add new message
        set({
          messages: [...currentMessages, { ...newMessage, status: 'delivered' }],
        });
      }
    });
  },

  //when we close the window or log out
  unsubscribeFromMessages: ()=>{
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageReactionUpdate");
    socket.off("messageEdited");
    socket.off("messageDeleted");
    socket.off("userTyping");
  },

  // Enhanced subscriptions
  subscribeToEnhancedMessages: () => {
    const socket = useAuthStore.getState().socket;
    
    // Message reactions
    socket.on("messageReactionUpdate", ({ messageId, reactions }) => {
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      }));
    });

    // Message editing
    socket.on("messageEdited", (editedMessage) => {
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === editedMessage._id ? editedMessage : msg
        )
      }));
    });

    // Message deletion
    socket.on("messageDeleted", (deletedMessage) => {
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === deletedMessage._id ? deletedMessage : msg
        )
      }));
    });

    // Message read receipts
    socket.on("messagesRead", ({ messageIds }) => {
      set(state => ({
        messages: state.messages.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, status: 'read' } : msg
        )
      }));
    });

    // Typing indicators
    socket.on("userTyping", ({ senderId, isTyping }) => {
      set(state => ({
        typingUsers: {
          ...state.typingUsers,
          [senderId]: isTyping
        }
      }));
    });
  },

  // Message reactions
  addReaction: async (messageId, emoji) => {
    try {
      await axiosInstance.post(`/messages/${messageId}/reaction`, { emoji });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add reaction");
    }
  },

  removeReaction: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}/reaction`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove reaction");
    }
  },

  // Message editing
  editMessage: async (messageId, text) => {
    try {
      await axiosInstance.put(`/messages/${messageId}/edit`, { text });
      set({ editingMessage: null });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to edit message");
    }
  },

  // Message deletion
  deleteMessage: async (messageId, deleteType = 'forEveryone') => {
    try {
      // For now, both types use the same endpoint
      // In a real app, you'd have separate endpoints or query parameters
      await axiosInstance.delete(`/messages/${messageId}?type=${deleteType}`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete message");
    }
  },

  // Typing indicators
  startTyping: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("typing", { receiverId });
  },

  stopTyping: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("stopTyping", { receiverId });
  },

  // Reply functionality
  setReplyingTo: (message) => set({ replyingTo: message }),
  clearReplyingTo: () => set({ replyingTo: null }),

  // Highlight functionality for scrolling to messages
  setHighlightedMessageId: (id) => set({ highlightedMessageId: id }),

  // Search index tracking
  setCurrentSearchIndex: (index) => set({ currentSearchIndex: index }),

  // Edit functionality
  setEditingMessage: (message) => set({ editingMessage: message }),
  clearEditingMessage: () => set({ editingMessage: null }),

  // Search functionality
  searchMessages: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: "", currentSearchIndex: 0 });
      return;
    }
    
    set({ searchQuery: query });
    const { messages } = get();
    
    // Sort results by most recent first
    const results = messages
      .filter(message => 
        message.text?.toLowerCase().includes(query.toLowerCase()) && !message.isDeleted
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    set({ searchResults: results, currentSearchIndex: 0 });
  },

  clearSearch: () => set({ searchResults: [], searchQuery: "", currentSearchIndex: 0 }),

  // Mark messages as read
  markAsRead: async (senderId) => {
    try {
      await axiosInstance.put(`/messages/read/${senderId}`);
      
      // Clear unread count for this sender
      const { unreadCounts } = get();
      const newCounts = { ...unreadCounts };
      delete newCounts[senderId];
      set({ unreadCounts: newCounts });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
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
