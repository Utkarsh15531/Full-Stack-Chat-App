import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Reply, Edit3, Mic } from "lucide-react";
import toast from "react-hot-toast";
import VoiceMessage from "./VoiceMessage";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [typingTimer, setTypingTimer] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const { 
    sentMessage, 
    replyingTo, 
    clearReplyingTo, 
    editingMessage, 
    clearEditingMessage, 
    editMessage,
    selectedUser,
    startTyping,
    stopTyping
  } = useChatStore();

  // Set text when editing
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || "");
      textInputRef.current?.focus();
    }
  }, [editingMessage]);

  // Handle typing indicators
  useEffect(() => {
    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [typingTimer]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    
    // Typing indicators
    if (selectedUser && !editingMessage) {
      startTyping(selectedUser._id);
      
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      
      const newTimer = setTimeout(() => {
        stopTyping(selectedUser._id);
      }, 1000);
      
      setTypingTimer(newTimer);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    // Stop typing indicator
    if (selectedUser && typingTimer) {
      clearTimeout(typingTimer);
      stopTyping(selectedUser._id);
    }

    try {
      if (editingMessage) {
        // Edit existing message
        await editMessage(editingMessage._id, text.trim());
        clearEditingMessage();
      } else {
        // Send new message
        await sentMessage({
          text: text.trim(),
          image: imagePreview,
          replyTo: replyingTo?._id,
          status: 'sending'
        });
        
        if (replyingTo) {
          clearReplyingTo();
        }
      }

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCancel = () => {
    if (editingMessage) {
      clearEditingMessage();
    }
    if (replyingTo) {
      clearReplyingTo();
    }
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleVoiceSend = async (voiceData) => {
    console.log('Voice data received in MessageInput:', voiceData);
    
    try {
      if (!voiceData.data) {
        throw new Error('No voice data provided');
      }
      
      await sentMessage({
        voiceMessage: voiceData.data,
        voiceDuration: voiceData.duration,
        replyTo: replyingTo?._id,
        status: 'sending'
      });
      
      if (replyingTo) {
        clearReplyingTo();
      }
      
      setShowVoiceRecorder(false);
      toast.success('Voice message sent!');
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast.error(`Failed to send voice message: ${error.message}`);
    }
  };

  return (
    <div className="p-4 w-full">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="mb-3 p-3 bg-base-200 rounded-lg border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Replying to:</span>
            </div>
            <button
              onClick={clearReplyingTo}
              className="text-base-content/50 hover:text-base-content"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-base-content/70 mt-1 truncate">
            {replyingTo.text || "[Image]"}
          </div>
        </div>
      )}
      
      {/* Edit indicator */}
      {editingMessage && (
        <div className="mb-3 p-3 bg-warning/10 rounded-lg border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">Editing message</span>
            </div>
            <button
              onClick={clearEditingMessage}
              className="text-base-content/50 hover:text-base-content"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Image preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center hover:bg-base-200"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Voice message recorder */}
      {showVoiceRecorder && (
        <VoiceMessage
          onSend={handleVoiceSend}
          onCancel={() => setShowVoiceRecorder(false)}
          className="mb-3"
        />
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            ref={textInputRef}
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyPress}
          />
          
          {/* Image upload - disabled while editing */}
          {!editingMessage && (
            <>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <button
                type="button"
                className={`hidden sm:flex btn btn-circle btn-ghost
                         ${imagePreview ? "text-emerald-500" : "text-base-content/50"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Image size={20} />
              </button>
            </>
          )}
          
          {/* Voice message button - disabled while editing */}
          {!editingMessage && (
            <button
              type="button"
              className={`btn btn-circle btn-ghost
                       ${showVoiceRecorder ? "text-primary" : "text-base-content/50"}`}
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              title="Record voice message"
            >
              <Mic size={20} />
            </button>
          )}
        </div>
        
        {/* Cancel button for edit/reply */}
        {(editingMessage || replyingTo) && (
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-sm btn-ghost"
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          className="btn btn-sm btn-circle btn-primary"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;