import api from '../services/api'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export async function getPushSubscription() {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!reg) return null
  return reg.pushManager.getSubscription()
}

export async function subscribeToPush(sessionId = null) {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted')
  }

  const { data } = await api.get('/push/vapid-public-key')
  if (!data.publicKey) {
    throw new Error('Push notifications are not configured on the server')
  }

  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  let subscription = await reg.pushManager.getSubscription()
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey)
    })
  }

  const json = subscription.toJSON()
  await api.post('/push/subscribe', {
    endpoint: json.endpoint,
    keys: json.keys,
    session_id: sessionId
  })

  return subscription
}

export async function unsubscribeFromPush() {
  const subscription = await getPushSubscription()
  if (!subscription) return

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await api.post('/push/unsubscribe', { endpoint })
}
