import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

const SoundManager = () => {
  const audioRef = useRef(null);
  const { selectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const { soundEnabled } = useThemeStore();

  useEffect(() => {
    // Create a simple beep sound using Web Audio API as fallback
    const createBeepSound = () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.log('Web Audio API not supported:', error);
      }
    };
    
    // Try to create audio element, fallback to Web Audio
    try {
      audioRef.current = new Audio('/notification.mp3'); // Optional: add this file to public folder
      audioRef.current.volume = 0.5;
    } catch (error) {
      audioRef.current = { play: createBeepSound };
    }
  }, []);

  useEffect(() => {
    const socket = useAuthStore.getState().socket;
    
    const handleNewMessage = (newMessage) => {
      // Play sound only if:
      // 1. Sound is enabled
      // 2. Message is not from current user
      // 3. Either no chat is selected or message is not from the currently selected user
      if (
        soundEnabled &&
        newMessage.senderId !== authUser._id &&
        (!selectedUser || newMessage.senderId !== selectedUser._id)
      ) {
        playNotificationSound();
      }
    };

    socket?.on('newMessage', handleNewMessage);

    return () => {
      socket?.off('newMessage', handleNewMessage);
    };
  }, [soundEnabled, authUser._id, selectedUser]);

  const playNotificationSound = async () => {
    try {
      if (audioRef.current) {
        // Reset the audio to play from beginning
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  return null; // This component doesn't render anything
};

export default SoundManager;
