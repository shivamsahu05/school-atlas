import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, CheckCircle, Info, Calendar, AlertTriangle, Home } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { Footer } from '../components/ui'
import ErrorBoundary from '../components/ErrorBoundary'
import { dashboardApi } from '../api'

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

/* ── Page title from path ─────────────────────────────────────────── */
function getTitle(pathname) {
  const map = {
    '/teacher':               'Dashboard',
    '/teacher/syllabus':      'Syllabus Tracking',
    '/teacher/syllabus-report': 'Syllabus Report',
    '/teacher/lo':            'Learning Outcomes',
    '/teacher/analytics':     'Performance Analytics',
    '/teacher/schedule':      'Micro Schedule',
    '/teacher/time-table':    'Time Table',
    '/teacher/leave':         'Leave Management',
    '/teacher/profile':       'My Profile',
    '/teacher/marks-entry':   'Marks Entry',
    '/teacher/events':        'Events & Notices',
    '/teacher/competitions':  'Competitions Management',
    '/admin':                 'School Overview',
    '/admin/syllabus':        'Syllabus Status',
    '/admin/syllabus-report': 'Syllabus Report',
    '/admin/schedule':        'Micro Schedule',
    '/admin/award-lo':        'Award LO Scores',
    '/admin/followups':       'Follow-ups',
    '/admin/observation':     'Classroom Observation',
    '/admin/performance':     'Teacher Performance',
    '/admin/users':           'User Management',
    '/admin/timetable':       'Timetable & Marks',
    '/admin/student-timetable': 'Student Timetable',
    '/admin/leave':           'Leave Approval',
    '/admin/marks-entry':     'Marks Entry',
    '/admin/notifications':   'Admin Notifications',
    '/admin/teachers':        'Teacher Directory',
    '/admin/students':        'Student Directory',
    '/admin/permissions':     'Permission Control',
    '/admin/competitions':    'Competitions',
    '/admin/events':          'Events & Notices',
    '/admin/contact':         'Messages',
    '/admin/system':          'System Tools',
    '/admin/academics':       'Manage Academics',
  }
  return map[pathname] ?? 'SAMS'
}

/* ── Notification Panel via React Portal ──────────────────────────── */
/* Rendered directly into document.body — fully escapes all parent    */
/* stacking contexts. Uses getBoundingClientRect to stay anchored.    */
function NotificationPortal({
  anchorRef, notifications, unreadCount,
  onClose, onNotifClick, onMarkAllRead, onClearAll, userRole, loading
}) {
  const [pos, setPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({
        top:   rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [anchorRef])

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        style={{ top: pos.top, right: window.innerWidth < 640 ? 16 : pos.right }}
        className="fixed z-[9999] w-[calc(100vw-32px)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-50 bg-slate-50/50">
          <p className="font-bold text-slate-800 text-sm">Notifications</p>
          <div className="flex gap-3">
            {!loading && notifications.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); onMarkAllRead(); }}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading alerts...</p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((n, i) => (
              <div
                key={n.id || i}
                onClick={() => onNotifClick(n)}
                className={`flex gap-3 p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${!n.read ? 'bg-brand-50/30' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  n.type === 'leave'   ? 'bg-amber-100 text-amber-600'   :
                  n.type === 'event'   ? 'bg-purple-100 text-purple-600' :
                  n.type === 'message' ? 'bg-brand-100 text-brand-600'   :
                  n.type === 'alert'   ? 'bg-rose-100 text-rose-600'     :
                                         'bg-blue-100 text-blue-600'
                }`}>
                  {n.type === 'leave'   ? <CheckCircle size={14} /> :
                   n.type === 'event'   ? <Calendar size={14} />    :
                   n.type === 'message' ? <Search size={14} />      :
                   n.type === 'alert'   ? <AlertTriangle size={14} /> :
                                          <Info size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm tracking-tight ${!n.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.text}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{n.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Bell size={20} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No new notifications.</p>
            </div>
          )}
        </div>

        <div className="p-3 text-center border-t border-slate-50 bg-slate-50/50">
          <Link
            to={userRole === 'admin' ? '/admin/notifications' : '/teacher/notifications'}
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            View History
          </Link>
        </div>
      </div>
    </>,
    document.body
  )
}

/* ── Main Layout ─────────────────────────────────────────────────── */
export function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { user, syncing } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // Ref on the bell wrapper — used by portal to calculate position
  const bellRef = useRef(null)

  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const userRole = user?.role

  const fetchNotifications = async () => {
    if (!user) return
    setLoadingNotifications(true)
    try {
      const res = await dashboardApi.getNotifications()
      if (res.success) {
        const formatted = (res.data || []).map(n => {
          let link = '/admin/notifications'
          if (userRole === 'teacher') link = '/teacher/notifications'
          else {
            if (n.type === 'leave') link = '/admin/leave'
            if (n.type === 'alert') link = '/admin/notifications'
            if (n.type === 'event') link = '/admin/syllabus'
          }
          return {
            ...n,
            time: formatRelativeTime(n.time),
            link
          }
        })
        setNotifications(formatted)
      }
    } catch (err) {
      console.error('[API getNotifications] Error:', err);
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    if (!syncing && !user) {
      navigate('/login')
    }
  }, [user, syncing, navigate])

  useEffect(() => {
    if (!syncing && user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [user, syncing])

  if (syncing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Syncing your account...</p>
      </div>
    )
  }

  if (!user) return null

  const unreadCount = notifications.filter(n => !n.read).length

  const handleNotifClick = (n) => {
    setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))
    setShowNotifications(false)
    navigate(n.link)
  }

  const markAllRead = async () => {
    try {
      // Optimistic update: set all to read immediately to clear badge
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      
      // Sync with backend
      await dashboardApi.markNotificationsRead()
      
      // Force a slight delay before next auto-fetch to ensure DB consistency
      setTimeout(fetchNotifications, 1500)
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
  }

  const clearAll = async () => {
    try {
      setNotifications([])
      await dashboardApi.clearNotifications()
    } catch (err) {
      console.error('Failed to clear notifications:', err)
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Sidebar */}
      <div className="relative flex-shrink-0">
        <Sidebar
          mobileOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(p => !p)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Sticky Header ──────────────────────────────────────────── */}
        {/* z-index via inline style to avoid Tailwind purge issues      */}
        <header
          className="sticky top-0 bg-white border-b border-slate-100 flex-shrink-0 h-14 px-4 lg:px-6 flex items-center justify-between"
          style={{ zIndex: 50 }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">{getTitle(pathname)}</h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                {user?.role === 'admin' ? 'Admin Portal' : `${user?.name} · Teacher Portal`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dashboard Home Shortcut */}
            <Link
              to={user?.role === 'admin' ? '/admin' : '/teacher'}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors flex items-center justify-center"
              title="Return to Dashboard"
            >
              <Home size={18} />
            </Link>

            {/* Bell button — wrapped in div with ref for portal anchor */}
            <div ref={bellRef}>
              <button
                onClick={() => setShowNotifications(prev => !prev)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1.5 min-w-[16px] h-4 bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold rounded-full ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Portal renders panel outside DOM tree — no stacking context issues */}
            {showNotifications && (
              <NotificationPortal
                anchorRef={bellRef}
                notifications={notifications}
                unreadCount={unreadCount}
                onClose={() => setShowNotifications(false)}
                onNotifClick={handleNotifClick}
                onMarkAllRead={markAllRead}
                onClearAll={clearAll}
                userRole={user?.role}
                loading={loadingNotifications}
              />
            )}

            {/* Avatar */}
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center ml-1">
              <span className="text-white text-xs font-bold">{user?.name?.[0]}</span>
            </div>
          </div>
        </header>

        {/* ── Scrollable Main ─────────────────────────────────────────── */}
        {/* No position:relative or z-index here — avoids stacking context */}
        {/* that would clip the portal-rendered notification dropdown       */}
        <main className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
          <div className={`p-4 lg:p-6 mx-auto w-full flex-1 ${
            pathname.includes('/schedule') || 
            pathname.includes('/timetable') || 
            pathname.includes('/marks-entry') 
              ? 'max-w-none' 
              : 'max-w-7xl'
          }`}>
            <ErrorBoundary key={pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
          <Footer />
        </main>

      </div>
    </div>
  )
}
