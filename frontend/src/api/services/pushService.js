import { api } from '../client.js';

// Browsers require the VAPID key as a Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushSupported = () =>
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/service-worker.js');
}

export async function subscribeToPush(userId) {
  if (!pushSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // Only prompt when we actually need to. If permission is already granted
  // (e.g. this is the re-subscribe-on-login effect), skip straight through.
  if (Notification.permission === 'denied') {
    throw new Error(
      'Notifications are blocked for this site. Enable them in your browser settings.'
    );
  }
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied.');
    }
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const { publicKey } = await api.get('/push/vapid-public-key');
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await api.post('/push/subscribe', { userId, subscription });
  return subscription;
}

/**
 * Remove just THIS user's subscription row. Leaves the browser-level
 * subscription untouched so other accounts on the same browser keep
 * receiving their own notifications.
 *
 * @param {string} userId
 */
export async function unsubscribeFromPush(userId) {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await api.delete('/push/unsubscribe', {
    userId,
    endpoint: subscription.endpoint,
  });
}

/**
 * Nuke the browser-level subscription entirely. Use only when the user
 * explicitly wants to stop ALL push notifications on this device — e.g.
 * a "Disable notifications on this device" button, not a per-account action.
 */
export async function hardUnsubscribe() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await subscription.unsubscribe();
}

export async function getExistingSubscription() {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}