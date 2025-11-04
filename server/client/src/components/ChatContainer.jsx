import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageReactions from "./MessageReactions";
import MessageMenu from "./MessageMenu";
import TypingIndicator from "./TypingIndicator";
import MessageStatus from "./MessageStatus";
import MessageText from "./MessageText";
import { VoiceMessagePlayer } from "./VoiceMessage";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToEnhancedMessages,
    markAsRead,
    highlightedMessageId,
    setHighlightedMessageId,
    searchQuery
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const highlightMessage = (id) => {
    if (!id) return;
    const el = document.getElementById(`message-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(id);
      // Remove highlight after 2 seconds
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();
    subscribeToEnhancedMessages();

    // Mark messages as read when opening chat
    markAsRead(selectedUser._id);

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, subscribeToEnhancedMessages, unsubscribeFromMessages, markAsRead]);

  //as new messages comes/sent 'messages' change so our use effect comes into work and our screen scroll down to new msg sent/recieved 
  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) { //when message is loading, we will display "MessageSkeleton" in place of "messages"
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`chat group ${message.senderId === authUser._id ? "chat-end" : "chat-start"} ${
              highlightedMessageId === message._id ? 'animate-pulse bg-primary/20 rounded-lg p-2 -m-2' : ''
            }`}
            ref={index === messages.length - 1 ? messageEndRef : null}
            id={`message-${message._id}`}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            
            <div className="chat-header mb-1 flex items-center gap-2">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
              {message.editedAt && (
                <span className="text-xs opacity-50">(edited)</span>
              )}
              {message.senderId === authUser._id && (
                <MessageStatus status={message.status || 'sent'} className="text-xs" />
              )}
              <MessageMenu message={message} />
            </div>
            
            <div className="chat-bubble flex flex-col relative">
              {/* Reply indicator */}
              {message.replyTo && (
                <div 
                  className="bg-base-300 rounded p-2 mb-2 border-l-4 border-primary cursor-pointer hover:bg-base-200 transition-colors"
                  onClick={() => highlightMessage(message.replyTo._id)}
                  title="Click to jump to original message"
                >
                  <div className="text-xs opacity-70 mb-1">Replying to:</div>
                  <div className="text-sm opacity-80">
                    {message.replyTo.text || "[Image]"}
                  </div>
                </div>
              )}
              
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              
              {message.voiceMessage && (
                <VoiceMessagePlayer 
                  audioUrl={message.voiceMessage}
                  duration={message.voiceDuration || 0}
                  className="mb-2"
                />
              )}
              
              {message.text && (
                <div className={message.isDeleted ? "italic opacity-60" : ""}>
                  <MessageText text={message.text} searchTerm={searchQuery} />
                </div>
              )}
              
              {/* Message reactions */}
              {!message.isDeleted && (
                <MessageReactions message={message} />
              )}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        <TypingIndicator selectedUser={selectedUser} />
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;