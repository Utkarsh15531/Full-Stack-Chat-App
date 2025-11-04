import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const MessageSearch = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const inputRef = useRef(null);
  const { 
    searchQuery, 
    searchResults, 
    searchMessages, 
    clearSearch,
    currentSearchIndex,
    setCurrentSearchIndex,
    setHighlightedMessageId
  } = useChatStore();

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (localQuery.trim()) {
        searchMessages(localQuery);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [localQuery, searchMessages, clearSearch]);

  const navigateToResult = (index) => {
    if (searchResults.length === 0) return;
    
    const message = searchResults[index];
    if (message) {
      const element = document.getElementById(`message-${message._id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMessageId(message._id);
        setTimeout(() => setHighlightedMessageId(null), 3000);
      }
    }
  };

  const handleNext = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    navigateToResult(nextIndex);
  };

  const handlePrevious = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    navigateToResult(prevIndex);
  };

  const handleToggle = () => {
    if (isExpanded && localQuery) {
      setLocalQuery('');
      clearSearch();
      setHighlightedMessageId(null);
    }
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setLocalQuery('');
      clearSearch();
      setHighlightedMessageId(null);
      setIsExpanded(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
  };

  return (
    <div className="flex items-center">
      {!isExpanded ? (
        <button
          onClick={handleToggle}
          className="p-2 hover:bg-base-200 rounded-lg transition-colors"
          title="Search messages"
        >
          <Search className="w-5 h-5" />
        </button>
      ) : (
        <div className="flex items-center bg-base-200 rounded-lg px-3 py-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-base-content/60 mr-2" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search messages..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none flex-1 text-sm"
          />
          
          {searchResults.length > 0 && (
            <>
              <span className="text-xs text-base-content/60 whitespace-nowrap mr-2">
                {currentSearchIndex + 1} of {searchResults.length}
              </span>
              
              <div className="flex gap-1 mr-2">
                <button
                  onClick={handlePrevious}
                  className="p-1 hover:bg-base-300 rounded transition-colors"
                  title="Previous result (Shift+Enter)"
                  disabled={searchResults.length === 0}
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1 hover:bg-base-300 rounded transition-colors"
                  title="Next result (Enter)"
                  disabled={searchResults.length === 0}
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
          
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-base-300 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
