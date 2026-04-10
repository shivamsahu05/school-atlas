import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, BookOpen, ClipboardList, Brain, BarChart2,
  Calendar, Users, Star, Bell, CheckSquare, Eye, TrendingUp,
  LogOut, X, GraduationCap, Clock, UserCog,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TEACHER_NAV = [
  { label: 'Dashboard',           icon: LayoutDashboard, to: '/teacher'            },
  { label: 'Syllabus Tracking',   icon: BookOpen,        to: '/teacher/syllabus'   },
  { label: 'Homework',            icon: ClipboardList,   to: '/teacher/homework'   },
  { label: 'Learning Outcomes',   icon: Brain,           to: '/teacher/lo'         },
  { label: 'Performance',         icon: BarChart2,       to: '/teacher/analytics'  },
  { label: 'Micro Schedule',      icon: Calendar,        to: '/teacher/schedule'   },
  { label: 'Leave Management',    icon: Clock,           to: '/teacher/leave'      },
]

const ADMIN_NAV = [
  { label: 'Dashboard',           icon: LayoutDashboard, to: '/admin'                  },
  { label: 'Syllabus Status',     icon: BookOpen,        to: '/admin/syllabus'         },
  { label: 'Award LO Scores',     icon: Star,            to: '/admin/award-lo'         },
  { label: 'Follow-ups',          icon: Bell,            to: '/admin/followups'        },
  { label: 'Classroom Obs.',      icon: Eye,             to: '/admin/observation'      },
  { label: 'Teacher Performance', icon: TrendingUp,      to: '/admin/performance'      },
  { label: 'User Management',     icon: UserCog,         to: '/admin/users'            },
  { label: 'Timetable & Marks',   icon: Calendar,        to: '/admin/timetable'        },
  { label: 'Leave Approval',      icon: CheckSquare,     to: '/admin/leave'            },
]

export function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const nav = user?.role === 'admin' ? ADMIN_NAV : TEACHER_NAV

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-sm">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">SAMS</p>
            <p className="text-[10px] text-slate-400 font-medium">ATLAS Platform</p>
          </div>
        </div>
        {/* Mobile close */}
        <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100">
          <X size={16} className="text-slate-500" />
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user?.name?.[0]}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/teacher' || item.to === '/admin'}
            onClick={onClose}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button onClick={handleLogout} className="nav-item w-full text-rose-500 hover:bg-rose-50 hover:text-rose-600">
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-100 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-64 bg-white h-full shadow-float animate-slide-right">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
