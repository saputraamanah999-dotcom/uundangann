// src/hooks/useNotificationPermission.ts
'use client';
import { useEffect, useState, useCallback } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db, SITE_ID } from '../lib/firebase/client';

export function useNotificationPermission() {
  const [status, setStatus] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setStatus('unsupported');
      return;
    }
    const currentPermission = Notification.permission;
    setStatus(currentPermission);

    if (currentPermission === 'granted') {
      // Auto refresh token on mount if permission is already granted
      try {
        const messaging = getMessaging(app);
        const vapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY || (process as any).env?.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        getToken(messaging, { vapidKey })
          .then((token) => {
            if (token) {
              setDoc(doc(db, `sites/${SITE_ID}/fcmTokens/${token}`), {
                updatedAt: new Date().toISOString(),
              }).catch(err => console.warn("Failed to write fcmToken on mount:", err));
            }
          })
          .catch((err) => {
            console.warn("Auto-getting token failed on mount:", err);
          });
      } catch (err) {
        console.warn("Messaging initialization failed on mount:", err);
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission);

      if (permission === 'granted') {
        try {
          const messaging = getMessaging(app);
          const vapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY || (process as any).env?.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          const token = await getToken(messaging, { vapidKey });
          if (token) {
            await setDoc(doc(db, `sites/${SITE_ID}/fcmTokens/${token}`), {
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (messagingError) {
          console.warn("FCM Messaging / Token generation skipped or unsupported:", messagingError);
        }
      }
      return permission;
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      return 'default';
    }
  }, []);

  return { status, requestPermission };
}
