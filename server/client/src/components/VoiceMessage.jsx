import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Send, X } from 'lucide-react';

const VoiceMessage = ({ onSend, onCancel, className = "" }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const playRecording = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSend = () => {
    if (recordedBlob) {
      console.log('Sending voice message:', { size: recordedBlob.size, type: recordedBlob.type, duration: recordingTime });
      
      const reader = new FileReader();
      reader.onload = () => {
        console.log('Voice message data length:', reader.result?.length);
        onSend({
          type: 'voice',
          data: reader.result,
          duration: recordingTime
        });
        resetRecording();
      };
      reader.onerror = (error) => {
        console.error('Error reading voice message file:', error);
        alert('Failed to process voice message');
      };
      reader.readAsDataURL(recordedBlob);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-base-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3">
        {!recordedBlob ? (
          // Recording state
          <>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`btn btn-circle ${isRecording ? 'btn-error' : 'btn-primary'}`}
              disabled={isRecording && recordingTime < 1}
            >
              {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <div className="flex-1">
              {isRecording ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 20 + 10}px`,
                          animationDelay: `${i * 100}ms`
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-mono">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-base-content/70">
                  Tap to record voice message
                </span>
              )}
            </div>
          </>
        ) : (
          // Playback state
          <>
            <button
              onClick={playRecording}
              className="btn btn-circle btn-primary"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-0 animate-pulse" />
                </div>
                <span className="text-sm font-mono">
                  {formatTime(recordingTime)}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleSend}
              className="btn btn-circle btn-success"
              title="Send voice message"
            >
              <Send className="w-4 h-4" />
            </button>
          </>
        )}
        
        <button
          onClick={resetRecording}
          className="btn btn-circle btn-ghost"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
};

// Voice message playback component for received messages
export const VoiceMessagePlayer = ({ audioUrl, duration, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 bg-base-300 rounded-lg p-3 min-w-[200px] ${className}`}>
      <button
        onClick={togglePlay}
        className="btn btn-circle btn-sm btn-primary"
      >
        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary/60 rounded-full"
                style={{
                  height: `${Math.random() * 16 + 8}px`
                }}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-base-content/70">
            {formatTime(duration)}
          </span>
        </div>
      </div>
      
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
};

export default VoiceMessage;