import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

const NotificationManager = () => {
  const { authUser } = useAuthStore();
  const { selectedUser } = useChatStore();

  useEffect(() => {
    if (!authUser) return;

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
          
          // Request notification permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Notification permission granted.');
          } else {
            console.log('Notification permission denied.');
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    registerServiceWorker();
  }, [authUser]);

  useEffect(() => {
    const socket = useAuthStore.getState().socket;
    
    const handleNewMessage = (newMessage) => {
      // Show browser notification if:
      // 1. User is not the sender
      // 2. Chat is not currently open for this user
      // 3. Notifications are supported and permitted
      if (
        newMessage.senderId !== authUser._id &&
        (!selectedUser || newMessage.senderId !== selectedUser._id) &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        showNotification(newMessage);
      }
    };

    socket?.on('newMessage', handleNewMessage);

    return () => {
      socket?.off('newMessage', handleNewMessage);
    };
  }, [authUser._id, selectedUser]);

  const showNotification = (message) => {
    const notification = new Notification('New Message', {
      body: message.text || 'You have a new message!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'new-message',
      renotify: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  };

  return null; // This component doesn't render anything
};

export default NotificationManager;
