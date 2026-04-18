<<<<<<< HEAD
import { useState, useRef, useEffect } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, CheckCircle, Info, Calendar, AlertTriangle } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useAuth } from '../context/AuthContext'

import { Footer } from '../components/ui'
import ErrorBoundary from '../components/ErrorBoundary'

=======
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Bell, Search } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useAuth } from '../context/AuthContext'

>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
/* Derive page title from current path */
function getTitle(pathname) {
  const map = {
    '/teacher':             'Dashboard',
    '/teacher/syllabus':    'Syllabus Tracking',
<<<<<<< HEAD
=======
    '/teacher/homework':    'Homework & Classwork',
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
    '/teacher/lo':          'Learning Outcomes',
    '/teacher/analytics':   'Performance Analytics',
    '/teacher/schedule':    'Micro Schedule',
    '/teacher/leave':       'Leave Management',
<<<<<<< HEAD
    '/teacher/profile':     'My Profile',
    '/teacher/notifications': 'Notifications Center',
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
    '/admin':               'School Overview',
    '/admin/syllabus':      'Syllabus Status',
    '/admin/award-lo':      'Award LO Scores',
    '/admin/followups':     'Follow-ups',
    '/admin/observation':   'Classroom Observation',
    '/admin/performance':   'Teacher Performance',
    '/admin/users':         'User Management',
    '/admin/timetable':     'Timetable & Marks',
    '/admin/leave':         'Leave Approval',
<<<<<<< HEAD
    '/admin/completion-report': 'Completion Report',
    '/admin/notifications': 'Admin Notifications',
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
  }
  return map[pathname] ?? 'SAMS'
}

export function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
<<<<<<< HEAD
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { user } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const notifRef = useRef(null)

  const [adminNotifications, setAdminNotifications] = useState([
    { id: 1, title: 'New Leave Request', text: 'Amit Verma requested 2 days leave.', type: 'leave', read: false, link: '/admin/leave', time: '10m ago' },
    { id: 2, title: 'New Contact Message', text: 'Rahul Sharma: Admissions Inquiry...', type: 'message', read: false, link: '/admin/contact', time: '14m ago' },
    { id: 3, title: 'Event Created', text: 'Science Fair 2024 has been scheduled.', type: 'event', read: false, link: '/admin/competitions', time: '1h ago' },
    { id: 4, title: 'Teacher Assigned', text: 'Dr. Smith was assigned Grade 8-A.', type: 'info', read: true, link: '/admin/teachers', time: '2h ago' },
    { id: 5, title: 'Incomplete Work', text: '107 Students have incomplete homework/notebooks.', type: 'alert', read: false, link: '/admin/completion-report', time: 'Just now' }
  ])

  const [teacherNotifications, setTeacherNotifications] = useState([
    { id: 101, title: 'Class Assigned', text: 'You have been assigned to Grade 8-A.', type: 'info', read: false, link: '/teacher/schedule', time: '10m ago' },
    { id: 102, title: 'Schedule Updated', text: 'Your micro schedule has been updated.', type: 'event', read: false, link: '/teacher/schedule', time: '1h ago' },
    { id: 103, title: 'Student Remarks', text: 'Admin added missing remarks on student profile.', type: 'message', read: true, link: '/teacher/students', time: '2h ago' }
  ])

  const notifications = user?.role === 'admin' ? adminNotifications : teacherNotifications
  const setNotifications = user?.role === 'admin' ? setAdminNotifications : setTeacherNotifications

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleNotifClick = (n) => {
    setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))
    setShowNotifications(false)
    navigate(n.link)
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="relative flex-shrink-0">
        <Sidebar mobileOpen={drawerOpen} onClose={() => setDrawerOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 flex-shrink-0 h-14 px-4 lg:px-6 flex items-center justify-between">
=======
  const { user } = useAuth()
  const { pathname } = useLocation()

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar mobileOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-4 lg:px-6 h-14 bg-white border-b border-slate-100 flex-shrink-0 z-10">
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
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
<<<<<<< HEAD
            {/* Search */}
=======
            {/* Search (decorative on mobile) */}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-sm w-48">
              <Search size={14} />
              <span>Search…</span>
            </div>

<<<<<<< HEAD
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="absolute top-1 right-1.5 min-w-[16px] h-4 bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold rounded-full ring-2 ring-white">{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-fade-in origin-top-right">
                  <div className="flex items-center justify-between p-4 border-b border-slate-50 bg-slate-50/50">
                    <p className="font-bold text-slate-800 text-sm">Notifications</p>
                    <div className="flex gap-3">
                      {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-brand-600 font-semibold hover:underline">Mark all read</button>}
                      {notifications.length > 0 && <button onClick={clearAll} className="text-xs text-rose-600 font-semibold hover:underline">Clear all</button>}
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotifClick(n)}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${!n.read ? 'bg-brand-50/30' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'leave' ? 'bg-amber-100 text-amber-600' : n.type === 'event' ? 'bg-purple-100 text-purple-600' : n.type === 'message' ? 'bg-brand-100 text-brand-600' : n.type === 'alert' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                          {n.type === 'leave' ? <CheckCircle size={14} /> : n.type === 'event' ? <Calendar size={14} /> : n.type === 'message' ? <Search size={14} /> : n.type === 'alert' ? <AlertTriangle size={14} /> : <Info size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm tracking-tight ${!n.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{n.title}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{n.text}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">{n.time}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 bg-brand-500 mt-1.5" />}
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-400 text-sm">No notifications</div>
                    )}
                  </div>
                  <div className="p-3 text-center border-t border-slate-50 bg-slate-50/50">
                    <Link to={user?.role === 'admin' ? "/admin/notifications" : "/teacher/notifications"} className="text-xs font-bold text-slate-500 hover:text-slate-700">View History</Link>
                  </div>
                </div>
              )}
            </div>

=======
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Avatar */}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center ml-1">
              <span className="text-white text-xs font-bold">{user?.name?.[0]}</span>
            </div>
          </div>
        </header>

<<<<<<< HEAD
        {/* Scrollable Main */}
        <main className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full flex-1">
            <ErrorBoundary key={pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
          <Footer />
=======
        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
        </main>
      </div>
    </div>
  )
}
