export function useNotifications() {
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  const notify = (title: string, options?: NotificationOptions) => {
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

  return { requestPermission, notify, supported: 'Notification' in window }
}
