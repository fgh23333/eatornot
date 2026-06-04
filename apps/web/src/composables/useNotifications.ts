import { ref } from 'vue'

export function useNotifications() {
  const supported = ref('Notification' in window)

  async function requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  function notify(title: string, options?: NotificationOptions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    if (document.visibilityState === 'visible') return
    const notification = new Notification(title, {
      icon: '/vite.svg',
      ...options,
    })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }

  return { requestPermission, notify, supported }
}
