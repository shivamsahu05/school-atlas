import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'

// Pages
import Landing         from './pages/Landing'
import Login           from './pages/Login'

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherSyllabus  from './pages/teacher/TeacherSyllabus'
import TeacherHomework  from './pages/teacher/TeacherHomework'
import TeacherLO        from './pages/teacher/TeacherLO'
import TeacherAnalytics from './pages/teacher/TeacherAnalytics'
import TeacherSchedule  from './pages/teacher/TeacherSchedule'
import TeacherLeave     from './pages/teacher/TeacherLeave'

// Principal pages
import AdminDashboard       from './pages/principal/AdminDashboard'
import AdminSyllabus        from './pages/principal/AdminSyllabus'
import AdminAwardLO         from './pages/principal/AdminAwardLO'
import {
  AdminFollowUps,
  AdminObservation,
  AdminTeacherPerformance,
  AdminUserManagement,
  AdminTimetable,
  AdminLeave,
} from './pages/principal/AdminScreens'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Teacher portal */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="teacher" />}>
            <Route element={<DashboardLayout />}>
              <Route path="/teacher"          element={<TeacherDashboard />} />
              <Route path="/teacher/syllabus" element={<TeacherSyllabus />} />
              <Route path="/teacher/homework" element={<TeacherHomework />} />
              <Route path="/teacher/lo"       element={<TeacherLO />} />
              <Route path="/teacher/analytics"element={<TeacherAnalytics />} />
              <Route path="/teacher/schedule" element={<TeacherSchedule />} />
              <Route path="/teacher/leave"    element={<TeacherLeave />} />
            </Route>
          </Route>
        </Route>

        {/* Principal / Admin portal */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="admin" />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin"                element={<AdminDashboard />} />
              <Route path="/admin/syllabus"       element={<AdminSyllabus />} />
              <Route path="/admin/award-lo"       element={<AdminAwardLO />} />
              <Route path="/admin/followups"      element={<AdminFollowUps />} />
              <Route path="/admin/observation"    element={<AdminObservation />} />
              <Route path="/admin/performance"    element={<AdminTeacherPerformance />} />
              <Route path="/admin/users"          element={<AdminUserManagement />} />
              <Route path="/admin/timetable"      element={<AdminTimetable />} />
              <Route path="/admin/leave"          element={<AdminLeave />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
