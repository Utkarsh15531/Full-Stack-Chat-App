import React, { useEffect } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useCallStore } from '../store/useCallStore';
import { formatMessageTime } from '../lib/utils';

const IncomingCall = () => {
  const { 
    incomingCall, 
    answerCall, 
    rejectCall, 
    clearIncomingCall 
  } = useCallStore();

  useEffect(() => {
    if (incomingCall) {
      // Play ringtone (you can add audio here)
      console.log('Incoming call:', incomingCall);
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  const { callId, callType, caller } = incomingCall;

  const handleAnswer = () => {
    answerCall(callId, caller._id);
  };

  const handleReject = () => {
    rejectCall(callId, caller._id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-base-100 rounded-2xl p-8 max-w-md w-full mx-4 text-center animate-pulse">
        <div className="mb-6">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden ring-4 ring-primary">
            <img
              src={caller?.profilePic || '/avatar.png'}
              alt={caller?.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-2xl font-semibold mb-2">
            {caller?.fullName} is calling...
          </h3>
          <p className="text-base-content/60 capitalize text-lg">
            {callType} call
          </p>
          <p className="text-base-content/40 text-sm mt-2">
            {formatMessageTime(new Date())}
          </p>
        </div>
        
        <div className="flex justify-center gap-8">
          <button
            onClick={handleReject}
            className="btn btn-circle btn-error btn-lg animate-bounce"
            title="Decline call"
          >
            <PhoneOff className="w-8 h-8" />
          </button>
          <button
            onClick={handleAnswer}
            className="btn btn-circle btn-success btn-lg animate-bounce"
            title="Answer call"
          >
            <Phone className="w-8 h-8" />
          </button>
        </div>
        
        <div className="mt-4 text-xs text-base-content/40">
          Call will timeout in 30 seconds
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;