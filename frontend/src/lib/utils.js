export const formatMessageTime = (date) => {
  const messageDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

  if (messageDay.getTime() === today.getTime()) {
    return messageDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return `Yesterday ${messageDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`;
  } else {
    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: messageDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    }) + ` ${messageDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`;
  }
};

export const formatLastSeen = (date) => {
  const lastSeenDate = new Date(date);
  const now = new Date();
  const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Online";
  if (diffInMinutes < 60) return `Last seen ${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `Last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastSeenDay = new Date(lastSeenDate.getFullYear(), lastSeenDate.getMonth(), lastSeenDate.getDate());
  
  if (lastSeenDay.getTime() === today.getTime()) {
    return `Last seen today at ${lastSeenDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`;
  } else if (lastSeenDay.getTime() === yesterday.getTime()) {
    return `Last seen yesterday at ${lastSeenDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`;
  } else {
    return `Last seen ${lastSeenDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: lastSeenDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    })} at ${lastSeenDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`;
  }
};

export const parseLinks = (text) => {
  // Enhanced URL regex that captures complete URLs including query parameters and fragments
  const urlRegex = /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=\/]*))|((?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=\/]*))|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      const textPart = text.slice(lastIndex, match.index);
      if (textPart) {
        parts.push({
          type: 'text',
          text: textPart,
          key: parts.length
        });
      }
    }
    
    // Add the URL
    const url = match[0];
    let href = url;
    
    if (url.includes('@')) {
      href = `mailto:${url}`;
    } else if (!url.startsWith('http')) {
      href = `https://${url}`;
    }
    
    parts.push({
      type: 'link',
      text: url,
      href,
      key: parts.length
    });
    
    lastIndex = match.index + url.length;
  }
  
  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      parts.push({
        type: 'text',
        text: remainingText,
        key: parts.length
      });
    }
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', text, key: 0 }];
};

export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm) return [{ type: 'text', text }];
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.split(regex).map((part, index) => ({
    type: part.toLowerCase() === searchTerm.toLowerCase() ? 'highlight' : 'text',
    text: part,
    key: index
  })).filter(item => item.text);
};
