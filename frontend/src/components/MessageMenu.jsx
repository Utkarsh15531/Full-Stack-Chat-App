import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, Reply, Copy, Smile } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageMenu = ({ message }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [menuPosition, setMenuPosition] = useState("bottom-right");
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const { deleteMessage, setEditingMessage, setReplyingTo, addReaction, removeReaction } = useChatStore();
  const { authUser } = useAuthStore();

  const isOwnMessage = message.senderId === authUser._id;
  
  // Time limits - 15 minutes for editing/deleting
  const messageAge = Date.now() - new Date(message.createdAt).getTime();
  const timeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
  const isWithinTimeLimit = messageAge < timeLimit;
  
  const canEdit = isOwnMessage && !message.isDeleted && isWithinTimeLimit;
  const canDelete = !message.isDeleted && isWithinTimeLimit;
  const canDeleteForEveryone = isOwnMessage && canDelete;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setShowMenu(false);
        setShowEmojiPicker(false);
        setShowDeleteOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuOpen = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = 260; // approximate
    const menuWidth = 200;  // approximate

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    let position = "bottom-right";
    if (spaceBelow > menuHeight) position = "bottom-right";
    else if (spaceAbove > menuHeight) position = "top-right";
    else if (spaceRight > menuWidth) position = "right";
    else position = "left";
    setMenuPosition(position);

    // Compute fixed coordinates so the menu stays fully visible like WhatsApp
    let top = rect.bottom + 6;
    let left = rect.right - 10;
    if (position === "top-right") {
      top = rect.top - menuHeight - 6;
    }
    if (position === "right") {
      top = rect.top;
      left = rect.right + 6;
    }
    if (position === "left") {
      top = rect.top;
      left = rect.left - menuWidth - 6;
    }

    // Clamp to viewport
    top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
    setMenuCoords({ top, left });
  };

  useEffect(() => {
    if (showMenu) handleMenuOpen();
    // eslint-disable-next-line
  }, [showMenu]);

  const handleReply = () => {
    if (!message.isDeleted) {
      setReplyingTo(message);
      setShowMenu(false);
    }
  };

  const handleEdit = () => {
    if (canEdit) {
      setEditingMessage(message);
      setShowMenu(false);
    }
  };

  const handleDeleteForMe = async () => {
    if (window.confirm('Delete this message for you only?')) {
      // In a real app, you'd have a separate API for this
      // For now, we'll use the same delete but mark it differently
      await deleteMessage(message._id, 'forMe');
      setShowMenu(false);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (window.confirm('Delete this message for everyone?')) {
      await deleteMessage(message._id, 'forEveryone');
      setShowMenu(false);
    }
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success('Message copied to clipboard');
      setShowMenu(false);
    }
  };
  
  const handleReactionClick = async (emoji) => {
    const userReaction = message.reactions?.find(
      r => r.userId === authUser._id && r.emoji === emoji
    );

    if (userReaction) {
      await removeReaction(message._id);
    } else {
      await addReaction(message._id, emoji);
    }
    setShowMenu(false);
    setShowEmojiPicker(false);
  };
  
  const getUserReactedEmojis = () => {
    return message.reactions
      ?.filter(r => r.userId === authUser._id)
      ?.map(r => r.emoji) || [];
  };
  
  const userReactedEmojis = getUserReactedEmojis();

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        ref={triggerRef}
        onClick={() => setShowMenu(!showMenu)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-base-200 rounded"
        title="Message options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuCoords.top, left: menuCoords.left, width: 200 }}
          className="z-50 bg-base-100 rounded-lg shadow-lg border py-2"
        >
          {/* Emoji Reactions */}
          {!message.isDeleted && (
            <>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-base-200 transition-colors"
              >
                <Smile className="w-4 h-4" />
                React
              </button>
              
              {showEmojiPicker && (
                <div className="px-3 py-2 border-t border-b border-base-200 my-1">
                  <div className="flex gap-2 flex-wrap">
                    {AVAILABLE_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReactionClick(emoji)}
                        className={`text-lg hover:bg-base-200 rounded p-1 transition-colors ${
                          userReactedEmojis.includes(emoji) ? 'bg-primary text-primary-content' : ''
                        }`}
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Reply */}
          {!message.isDeleted && (
            <button
              onClick={handleReply}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-base-200 transition-colors"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
          )}

          {/* Copy */}
          {message.text && !message.isDeleted && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-base-200 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          )}

          {/* Edit */}
          {canEdit && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-base-200 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit {!isWithinTimeLimit && '(expired)'}
            </button>
          )}

          {/* Delete Options */}
          {canDelete && (
            <>
              <button
                onClick={() => setShowDeleteOptions(!showDeleteOptions)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-base-200 transition-colors text-error"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              
              {showDeleteOptions && (
                <div className="px-3 py-2 border-t border-base-200 mt-1">
                  <button
                    onClick={handleDeleteForMe}
                    className="flex items-center gap-2 w-full px-2 py-1 text-xs hover:bg-base-200 transition-colors text-error rounded mb-1"
                  >
                    Delete for me
                  </button>
                  
                  {canDeleteForEveryone && (
                    <button
                      onClick={handleDeleteForEveryone}
                      className="flex items-center gap-2 w-full px-2 py-1 text-xs hover:bg-base-200 transition-colors text-error rounded"
                    >
                      Delete for everyone
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Time limit indicator */}
          {(canEdit || canDelete) && (
            <div className="px-3 py-1 border-t border-base-200 mt-1">
              <div className="text-xs text-base-content/50">
                {Math.max(0, Math.floor((timeLimit - messageAge) / 60000))} min left
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageMenu;
