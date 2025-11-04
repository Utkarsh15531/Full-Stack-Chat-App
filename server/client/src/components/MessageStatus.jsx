import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageStatus = ({ status, className = "" }) => {
  // status can be: 'sending', 'sent', 'delivered', 'read'
  
  if (status === 'sending') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="w-3 h-3 rounded-full border-2 border-current animate-spin border-t-transparent opacity-50" />
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div className={`inline-flex items-center text-base-content/60 ${className}`}>
        <Check className="w-3 h-3" />
      </div>
    );
  }

  if (status === 'delivered') {
    return (
      <div className={`inline-flex items-center text-base-content/60 ${className}`}>
        <CheckCheck className="w-3 h-3" />
      </div>
    );
  }

  if (status === 'read') {
    return (
      <div className={`inline-flex items-center text-blue-500 ${className}`}>
        <CheckCheck className="w-3 h-3" />
      </div>
    );
  }

  return null;
};

export default MessageStatus;