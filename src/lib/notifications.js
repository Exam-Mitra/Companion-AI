// Push notifications via OneSignal's free tier — no backend/database needed on our side.
//
// Setup (one-time, free):
//   1. Create a free account at https://onesignal.com
//   2. Create a new app -> Web Push platform -> point it at your Vercel URL
//   3. Copy your OneSignal "App ID" and paste it below as ONESIGNAL_APP_ID
//   4. Add the OneSignal SDK script tag to index.html (see README for the exact snippet)
//
// Until ONESIGNAL_APP_ID is filled in, these functions safely no-op so the rest of the
// app keeps working normally (the toggle in Settings will just report "not supported").

const ONESIGNAL_APP_ID = ''; // <-- paste your OneSignal App ID here

export function isPushSupported() {
  return Boolean(ONESIGNAL_APP_ID) && 'serviceWorker' in navigator && 'PushManager' in window;
}

function getOneSignal() {
  return window.OneSignal;
}

export async function subscribeToPush() {
  if (!isPushSupported()) return false;
  try {
    const OneSignal = getOneSignal();
    if (!OneSignal) return false;
    await OneSignal.init({ appId: ONESIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true });
    await OneSignal.Notifications.requestPermission();
    return OneSignal.Notifications.permission === true;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;
  try {
    const OneSignal = getOneSignal();
    if (!OneSignal) return;
    await OneSignal.User.PushSubscription.optOut();
  } catch {
    // ignore
  }
}
