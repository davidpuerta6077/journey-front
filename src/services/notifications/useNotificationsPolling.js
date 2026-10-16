import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from 'react-oidc-context'
import { fetchNotifications } from './fetchNotifications'
import { fetchUnreadCount } from './fetchUnreadCount'
import { markNotificationRead } from './markNotificationRead'
import { markAllNotificationsRead } from './markAllNotificationsRead'

const POLL_MS = 30000

// Campanita del navbar: solo hace polling del conteo (liviano); la lista
// completa se trae al abrir el dropdown, no en cada tick.
export function useNotificationsPolling() {
  const auth = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const intervalRef = useRef(null)

  const refreshUnreadCount = useCallback(async () => {
    if (!auth.isAuthenticated) return
    try {
      setUnreadCount(await fetchUnreadCount())
    } catch {
      // best-effort: un tick fallido no debe romper la campanita
    }
  }, [auth.isAuthenticated])

  useEffect(() => {
    if (!auth.isAuthenticated) return
    refreshUnreadCount()
    intervalRef.current = setInterval(refreshUnreadCount, POLL_MS)
    return () => clearInterval(intervalRef.current)
  }, [auth.isAuthenticated, refreshUnreadCount])

  const refreshList = useCallback(async () => {
    setLoadingList(true)
    try {
      setNotifications(await fetchNotifications())
    } catch {
      setNotifications([])
    } finally {
      setLoadingList(false)
    }
  }, [])

  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n))
    setUnreadCount(c => Math.max(0, c - 1))
    try {
      await markNotificationRead(id)
    } catch {
      refreshUnreadCount()
    }
  }, [refreshUnreadCount])

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    setUnreadCount(0)
    try {
      await markAllNotificationsRead()
    } catch {
      refreshUnreadCount()
    }
  }, [refreshUnreadCount])

  return { unreadCount, notifications, loadingList, refreshList, markRead, markAllRead }
}
