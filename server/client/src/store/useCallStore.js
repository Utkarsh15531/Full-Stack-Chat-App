import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import { toast } from "react-hot-toast";

export const useCallStore = create((set, get) => ({
  // Call state
  activeCall: null, // { callId, callType, participant, isIncoming, status }
  incomingCall: null, // { callId, callType, caller }
  callStatus: 'idle', // 'idle', 'calling', 'ringing', 'connected', 'ended'
  
  // Use a ref for the timeout ID
  callTimeout: null,  //added later

  // Call functions
  initiateCall: (participantId, callType) => {
    const callId = Date.now().toString();
    const socket = useAuthStore.getState().socket;
    const CALL_TIMEOUT_MS = 60000; // 60 seconds, added later
    
    if (!socket) {
      toast.error("Connection not established");
      return;
    }

    set({
      activeCall: {
        callId,
        callType,
        participantId,
        isIncoming: false,
        status: 'calling'
      },
      callStatus: 'calling'
    });

    // Set the timeout (60 seconds)
    const timeoutId = setTimeout(() => {
        const currentCall = get().activeCall;
        // Only auto-end if the call hasn't been answered/rejected yet
        if (currentCall && currentCall.status === 'calling') { 
            toast.error("Call missed: No answer.");
            
            // Emit to server to clean up, then run local endCall
            get().endCall(currentCall.callId, currentCall.participantId); 
            
            // We also need to emit an event so the callee stops ringing
            if (socket) {
                socket.emit("rejectCall", {
                    callId: currentCall.callId,
                    callerId: useAuthStore.getState().authUser._id
                });
            }
        }
        set({ callTimeout: null });
    }, CALL_TIMEOUT_MS);

    set({ callTimeout: timeoutId }); //added later


    // Emit call initiation to server
    socket.emit("initiateCall", {
      receiverId: participantId,
      callType,
      callId
    });
  },

  answerCall: (callId, callerId) => {
    const socket = useAuthStore.getState().socket;
    
    if (!socket) {
      toast.error("Connection not established");
      return;
    }

    const { incomingCall } = get();
    
    set({
      activeCall: {
        callId,
        callType: incomingCall?.callType,
        participantId: callerId,
        isIncoming: true,
        status: 'connected'
      },
      incomingCall: null,
      callStatus: 'connected'
    });

    socket.emit("answerCall", {
      callId,
      callerId,
      answer: true
    });
  },

  rejectCall: (callId, callerId) => {
    const socket = useAuthStore.getState().socket;
    
    if (socket) {
      socket.emit("rejectCall", {
        callId,
        callerId
      });
    }

    set({
      incomingCall: null,
      callStatus: 'idle'
    });
  },

  endCall: (callId, participantId) => {
    const socket = useAuthStore.getState().socket;

    // FIX 1: added later, Clear the call timeout immediately if it exists
    const { callTimeout } = get();
    if (callTimeout) {
      clearTimeout(callTimeout);
      set({ callTimeout: null });
    }
    // END FIX 1
    
    if (socket && participantId) {
      socket.emit("endCall", {
        callId,
        participantId
      });
    }

    set({
      activeCall: null,
      incomingCall: null,
      callStatus: 'ended'
    });

    // Reset to idle after a short delay
    setTimeout(() => {
      set({ callStatus: 'idle' });
    }, 1000);
  },

  setIncomingCall: (callData) => {
    set({ 
      incomingCall: callData,
      callStatus: 'ringing'
    });
  },

  clearIncomingCall: () => {
    set({ 
      incomingCall: null,
      callStatus: 'idle'
    });
  },

  setCallStatus: (status) => {
    set({ callStatus: status });
  },

  // Subscribe to call-related socket events
  subscribeToCallEvents: () => {
    const socket = useAuthStore.getState().socket;
    
    if (!socket) return;

    socket.on("incomingCall", (data) => {
      const { callId, callType, caller, timestamp } = data;
      
      set({
        incomingCall: {
          callId,
          callType,
          caller,
          timestamp
        },
        callStatus: 'ringing'
      });
    });

    socket.on("callAnswered", (data) => {
      clearTimeout(get().callTimeout); // Clear on answer, added later
      set({ callTimeout: null }); //added later

      const { callId, answeredBy } = data;
      
      set(state => ({
        activeCall: state.activeCall ? {
          ...state.activeCall,
          status: 'connected'
        } : null,
        callStatus: 'connected'
      }));
    });

    socket.on("callRejected", (data) => {
      clearTimeout(get().callTimeout); // Clear on reject, added later
      set({ callTimeout: null });//added later

      toast.error("Call was rejected");
      
      set({
        activeCall: null,
        callStatus: 'ended'
      });
      
      setTimeout(() => {
        set({ callStatus: 'idle' });
      }, 1000);
    });

    socket.on("callEnded", (data) => {
      // toast.info("Call ended");
      console.log("Call ended - Toast suppressed.");
      
      set({
        activeCall: null,
        callStatus: 'ended'
      });
      
      setTimeout(() => {
        set({ callStatus: 'idle' });
      }, 1000);
    });

    socket.on("callFailed", (data) => {
      toast.error(data.reason || "Call failed");
      
      set({
        activeCall: null,
        callStatus: 'ended'
      });
      
      setTimeout(() => {
        set({ callStatus: 'idle' });
      }, 1000);
    });
  },

  unsubscribeFromCallEvents: () => {
    const socket = useAuthStore.getState().socket;
    
    if (!socket) return;
    
    socket.off("incomingCall");
    socket.off("callAnswered");
    socket.off("callRejected");
    socket.off("callEnded");
    socket.off("callFailed");
  }
}));