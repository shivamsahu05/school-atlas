import React, { useState, useMemo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  LayoutDashboard, BookOpen, ClipboardList, Brain, BarChart2,
  Calendar, Users, Star, Bell, CheckSquare, Eye, TrendingUp, Trophy,
  LogOut, X, GraduationCap, Clock, UserCog, User, ShieldCheck, Settings, Mail,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TEACHER_NAV = [
  { label: 'Dashboard',           icon: LayoutDashboard, to: '/teacher'            },
  { label: 'Syllabus Tracking',   icon: BookOpen,        to: '/teacher/syllabus'   },
  { label: 'Learning Outcomes',   icon: Brain,           to: '/teacher/lo'         },
  { label: 'Performance',         icon: BarChart2,       to: '/teacher/analytics'  },
  { label: 'Time Table',          icon: Clock,           to: '/teacher/time-table' },
  { label: 'Micro Schedule',      icon: Calendar,        to: '/teacher/schedule'   },
  { label: 'Events & Notices',     icon: Bell,          to: '/teacher/events'     },
  { label: 'Competitions',        icon: Trophy,        to: '/teacher/competitions' },
  { label: 'Leave Management',    icon: Clock,           to: '/teacher/leave'      },
  { label: 'Notifications',       icon: Bell,            to: '/teacher/notifications'},
  { label: 'My Profile',          icon: User,            to: '/teacher/profile'    },
]

const ADMIN_NAV = [
  { label: 'Dashboard',           icon: LayoutDashboard, to: '/admin'                  },
  { label: 'Syllabus Status',     icon: BookOpen,        to: '/admin/syllabus'         },
  { label: 'Award LO Scores',     icon: Star,            to: '/admin/award-lo'         },
  { label: 'Follow-ups',          icon: Bell,            to: '/admin/followups'        },
  { label: 'Messages',            icon: Mail,            to: '/admin/contact'          },
  { label: 'Events & Notices',    icon: Bell,            to: '/admin/events'           },
  { label: 'Competitions',        icon: Trophy,          to: '/admin/competitions'     },
  { label: 'Classroom Obs.',      icon: Eye,             to: '/admin/observation'      },
  { label: 'Teacher Directory',   icon: Users,           to: '/admin/teachers'         },
  { label: 'Student Directory',   icon: GraduationCap,   to: '/admin/students'         },
  { label: 'Manage Academics',    icon: BookOpen,        to: '/admin/academics'        },
  { label: 'Permission Control',  icon: ShieldCheck,     to: '/admin/permissions'      },
  { label: 'Teacher Timetable',   icon: Calendar,        to: '/admin/timetable'        },
  { label: 'Student Timetable',   icon: Users,           to: '/admin/student-timetable' },
  { label: 'Leave Approval',      icon: CheckSquare,     to: '/admin/leave'            },
  { label: 'System Tools',        icon: Settings,        to: '/admin/system'           },
  { label: 'Notifications',       icon: Bell,            to: '/admin/notifications'    },
]

function SidebarContent({ isDesktop = false, collapsed, user, onClose, nav, onSignOut }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100">
        <div className={clsx("flex items-center gap-3", collapsed && isDesktop && "justify-center w-full")}>
          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <GraduationCap size={20} className="text-white" />
          </div>
          {!(collapsed && isDesktop) && (
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">SAMS</p>
              <p className="text-[10px] text-slate-400 font-medium">ATLAS Platform</p>
            </div>
          )}
        </div>
        {/* Mobile close */}
        <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100">
          <X size={16} className="text-slate-500" />
        </button>
      </div>

      {/* User info */}
      {!(collapsed && isDesktop) ? (
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
      ) : (
        <div className="px-2 py-3 border-b border-slate-100 flex justify-center">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center" title={user?.name}>
            <span className="text-white text-xs font-bold">{user?.name?.[0]}</span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/teacher' || item.to === '/admin'}
            onClick={onClose}
            title={collapsed && isDesktop ? item.label : undefined}
            className={({ isActive }) => clsx(
              'nav-item',
              isActive && 'active',
              collapsed && isDesktop && 'justify-center !px-2'
            )}
          >
            <item.icon size={17} />
            {!(collapsed && isDesktop) && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={onSignOut}
          title={collapsed && isDesktop ? 'Sign Out' : undefined}
          className={clsx(
            "nav-item w-full text-rose-500 hover:bg-rose-50 hover:text-rose-600",
            collapsed && isDesktop && "justify-center !px-2"
          )}
        >
          <LogOut size={17} />
          {!(collapsed && isDesktop) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )
}

export function Sidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showSignoutAlert, setShowSignoutAlert] = useState(false)

  // Memoize permissions and nav to avoid unnecessary re-renders
  const nav = useMemo(() => {
    if (user?.role === 'admin') return ADMIN_NAV;

    const hasStudentAccess = user?.permissions?.some(p => {
      if (p.module !== 'students_management') return false;
      if (!p.expiresAt) return true;
      const expiry = new Date(p.expiresAt);
      expiry.setHours(23, 59, 59, 999);
      return new Date() <= expiry;
    });

    const teacherNav = [...TEACHER_NAV];
    if (hasStudentAccess) {
      teacherNav.push({ label: 'Students', icon: GraduationCap, to: '/teacher/students' });
    }
    return teacherNav;
  }, [user?.role, user?.permissions]);

  const handleLogout = () => {
    logout()
    navigate('/login')
  }


  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block relative flex-shrink-0">
        <aside className={clsx(
          "flex flex-col bg-white border-r border-slate-100 h-screen sticky top-0 transition-all duration-300",
          collapsed ? "w-[68px]" : "w-60"
        )}>
          <SidebarContent 
            isDesktop 
            collapsed={collapsed}
            user={user}
            onClose={onClose}
            nav={nav}
            onSignOut={() => setShowSignoutAlert(true)}
          />
        </aside>
        {/* Premium collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="fixed z-[60] group"
          style={{ left: collapsed ? 56 : 232, top: 24, transition: 'left 0.3s ease' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="w-6 h-10 rounded-r-lg bg-white border-2 border-l-0 border-brand-400 flex items-center justify-center transition-all duration-200 group-hover:w-7 group-hover:bg-brand-50" style={{ boxShadow: '3px 2px 10px rgba(26, 86, 219, 0.25)' }}>
            <div className="transition-transform duration-200" style={{ transform: collapsed ? 'rotate(0)' : 'rotate(180deg)' }}>
              <ChevronRight size={13} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
            </div>
          </div>
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-64 bg-white h-full shadow-float animate-slide-right">
            <SidebarContent 
              user={user}
              onClose={onClose}
              nav={nav}
              onSignOut={() => setShowSignoutAlert(true)}
            />
          </aside>
        </div>
      )}

      {/* Premium Sign Out Alert Modal */}
      {showSignoutAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity opacity-100"
            onClick={() => setShowSignoutAlert(false)}
          />
          
          <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-rose-600" />
            
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4 shadow-sm border border-rose-100">
                <LogOut size={28} className="text-rose-500 mt-1 mr-1" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2">
                Ready to leave?
              </h3>
              
              <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-[260px]">
                You are about to sign out of your account. You will need to log back in to access your dashboard.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowSignoutAlert(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-colors focus:ring-2 focus:ring-slate-100 outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-200 transition-colors focus:ring-2 focus:ring-rose-200 outline-none"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
