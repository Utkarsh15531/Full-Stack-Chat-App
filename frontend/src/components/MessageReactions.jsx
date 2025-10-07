import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';

const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageReactions = ({ message, showAll = false }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { addReaction, removeReaction } = useChatStore();
  const { authUser } = useAuthStore();

  const handleReactionClick = async (emoji) => {
    const userReaction = message.reactions?.find(
      r => r.userId === authUser._id && r.emoji === emoji
    );

    if (userReaction) {
      await removeReaction(message._id);
    } else {
      await addReaction(message._id, emoji);
    }
    setShowEmojiPicker(false);
  };

  const getReactionCounts = () => {
    const counts = {};
    message.reactions?.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    return counts;
  };

  const getUserReactedEmojis = () => {
    return message.reactions
      ?.filter(r => r.userId === authUser._id)
      ?.map(r => r.emoji) || [];
  };

  const reactionCounts = getReactionCounts();
  const userReactedEmojis = getUserReactedEmojis();

  // Only show reactions if there are any
  if (Object.keys(reactionCounts).length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 mt-2">
      {/* Display existing reactions only */}
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            userReactedEmojis.includes(emoji)
              ? 'bg-primary text-primary-content'
              : 'bg-base-200 hover:bg-base-300'
          } transition-colors`}
          title={`${count} reaction${count !== 1 ? 's' : ''}`}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </button>
      ))}
    </div>
  );
};

export default MessageReactions;
