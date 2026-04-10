import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Bell, Search } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useAuth } from '../context/AuthContext'

/* Derive page title from current path */
function getTitle(pathname) {
  const map = {
    '/teacher':             'Dashboard',
    '/teacher/syllabus':    'Syllabus Tracking',
    '/teacher/homework':    'Homework & Classwork',
    '/teacher/lo':          'Learning Outcomes',
    '/teacher/analytics':   'Performance Analytics',
    '/teacher/schedule':    'Micro Schedule',
    '/teacher/leave':       'Leave Management',
    '/admin':               'School Overview',
    '/admin/syllabus':      'Syllabus Status',
    '/admin/award-lo':      'Award LO Scores',
    '/admin/followups':     'Follow-ups',
    '/admin/observation':   'Classroom Observation',
    '/admin/performance':   'Teacher Performance',
    '/admin/users':         'User Management',
    '/admin/timetable':     'Timetable & Marks',
    '/admin/leave':         'Leave Approval',
  }
  return map[pathname] ?? 'SAMS'
}

export function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user } = useAuth()
  const { pathname } = useLocation()

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar mobileOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-4 lg:px-6 h-14 bg-white border-b border-slate-100 flex-shrink-0 z-10">
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
            {/* Search (decorative on mobile) */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-sm w-48">
              <Search size={14} />
              <span>Search…</span>
            </div>

            {/* Notification bell */}
            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center ml-1">
              <span className="text-white text-xs font-bold">{user?.name?.[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
