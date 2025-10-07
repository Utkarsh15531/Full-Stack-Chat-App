import React from 'react';
import { useChatStore } from '../store/useChatStore';

const TypingIndicator = ({ selectedUser }) => {
  const { typingUsers } = useChatStore();
  const isUserTyping = typingUsers[selectedUser?._id];

  if (!isUserTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-base-content/70">
      <div className="flex space-x-1">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
      <span>{selectedUser?.fullName} is typing...</span>
      
      <style jsx>{`
        .typing-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: hsl(var(--bc) / 0.5);
          animation: typing 1.4s infinite;
        }
        
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
