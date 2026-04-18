import { Routes, Route, Navigate } from 'react-router-dom'
<<<<<<< HEAD
import { Toaster } from 'react-hot-toast'
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'

// Pages
import Landing         from './pages/Landing'
import Login           from './pages/Login'

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherSyllabus  from './pages/teacher/TeacherSyllabus'
<<<<<<< HEAD
=======
import TeacherHomework  from './pages/teacher/TeacherHomework'
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
import TeacherLO        from './pages/teacher/TeacherLO'
import TeacherAnalytics from './pages/teacher/TeacherAnalytics'
import TeacherSchedule  from './pages/teacher/TeacherSchedule'
import TeacherLeave     from './pages/teacher/TeacherLeave'
<<<<<<< HEAD
import TeacherProfile   from './pages/teacher/TeacherProfile'
import TeacherNotifications from './pages/teacher/TeacherNotifications'
import TeacherEvents from './pages/teacher/TeacherEvents'
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

// Principal pages
import AdminDashboard       from './pages/principal/AdminDashboard'
import AdminSyllabus        from './pages/principal/AdminSyllabus'
import AdminAwardLO         from './pages/principal/AdminAwardLO'
<<<<<<< HEAD
import AdminFollowUps from './pages/principal/AdminFollowUps'
import AdminObservation from './pages/principal/AdminObservation'
import AdminTeacherPerformance from './pages/principal/AdminTeacherPerformance'
import AdminUserManagement from './pages/principal/AdminUserManagement'
import AdminTimetable from './pages/principal/AdminTimetable'
import AdminLeave from './pages/principal/AdminLeave'
import AdminStudents from './pages/principal/AdminStudents'
import AdminTeachers from './pages/principal/AdminTeachers'
import AdminPermissions from './pages/principal/AdminPermissions'
import AdminCompetitions from './pages/principal/AdminCompetitions'
import AdminContact from './pages/principal/AdminContact'
import AdminSystemTools from './pages/principal/AdminSystemTools'
import AdminAcademics from './pages/principal/AdminAcademics'
import AdminSubjects from './pages/principal/AdminSubjects'
import CompletionReport from './pages/principal/CompletionReport'
import AdminNotifications from './pages/principal/AdminNotifications'
import ErrorBoundary from './components/ErrorBoundary'
=======
import {
  AdminFollowUps,
  AdminObservation,
  AdminTeacherPerformance,
  AdminUserManagement,
  AdminTimetable,
  AdminLeave,
} from './pages/principal/AdminScreens'
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

export default function App() {
  return (
    <AuthProvider>
<<<<<<< HEAD
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <ErrorBoundary>
        <Routes>
=======
      <Routes>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
        {/* Public */}
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Teacher portal */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="teacher" />}>
            <Route element={<DashboardLayout />}>
              <Route path="/teacher"          element={<TeacherDashboard />} />
              <Route path="/teacher/syllabus" element={<TeacherSyllabus />} />
<<<<<<< HEAD
=======
              <Route path="/teacher/homework" element={<TeacherHomework />} />
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
              <Route path="/teacher/lo"       element={<TeacherLO />} />
              <Route path="/teacher/analytics"element={<TeacherAnalytics />} />
              <Route path="/teacher/schedule" element={<TeacherSchedule />} />
              <Route path="/teacher/leave"    element={<TeacherLeave />} />
<<<<<<< HEAD
              <Route path="/teacher/profile"  element={<TeacherProfile />} />
              <Route path="/teacher/notifications" element={<TeacherNotifications />} />
              <Route path="/teacher/events"   element={<TeacherEvents />} />
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
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
<<<<<<< HEAD
              <Route path="/admin/teachers"       element={<AdminTeachers />} />
              <Route path="/admin/students"       element={<AdminStudents />} />
              <Route path="/admin/permissions"    element={<AdminPermissions />} />
              <Route path="/admin/competitions"   element={<AdminCompetitions />} />
              <Route path="/admin/contact"        element={<AdminContact />} />
              <Route path="/admin/system"         element={<AdminSystemTools />} />
              <Route path="/admin/academics"      element={<AdminAcademics />} />
              <Route path="/admin/subjects"       element={<AdminSubjects />} />
              <Route path="/admin/timetable"      element={<AdminTimetable />} />
              <Route path="/admin/leave"          element={<AdminLeave />} />
              <Route path="/admin/completion-report" element={<CompletionReport />} />
              <Route path="/admin/notifications"  element={<AdminNotifications />} />
=======
              <Route path="/admin/users"          element={<AdminUserManagement />} />
              <Route path="/admin/timetable"      element={<AdminTimetable />} />
              <Route path="/admin/leave"          element={<AdminLeave />} />
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
<<<<<<< HEAD
    </ErrorBoundary>
  </AuthProvider>
=======
    </AuthProvider>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
  )
}
