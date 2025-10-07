import React from 'react';
import { parseLinks, highlightSearchTerm } from '../lib/utils';

const MessageText = ({ text, searchTerm, className = "" }) => {
  if (!text) return null;

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    
    // Always open links in new tab for security
    try {
      // Validate URL before opening
      const url = new URL(href.startsWith('http') ? href : `https://${href}`);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Invalid URL:', href);
      // Fallback: try to open as-is
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const renderTextWithHighlight = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const parts = highlightSearchTerm(text, searchTerm);
    return parts.map(part => (
      part.type === 'highlight' ? (
        <mark key={part.key} className="bg-yellow-300 text-black rounded px-1">
          {part.text}
        </mark>
      ) : (
        <span key={part.key}>{part.text}</span>
      )
    ));
  };

  const linkParts = parseLinks(text);
  
  return (
    <div className={className}>
      {linkParts.map(part => (
        part.type === 'link' ? (
          <a
            key={part.key}
            href={part.href}
            onClick={(e) => handleLinkClick(e, part.href)}
            className="text-blue-400 hover:text-blue-300 underline break-words cursor-pointer transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            title="Click to open link in new tab"
          >
            {renderTextWithHighlight(part.text, searchTerm)}
          </a>
        ) : (
          <span key={part.key} className="break-words">
            {renderTextWithHighlight(part.text, searchTerm)}
          </span>
        )
      ))}
    </div>
  );
};

export default MessageText;