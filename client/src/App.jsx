import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AuthRoute, ProtectedRoute } from './components/RouteGuards'
import AppLayout from './components/AppLayout'
import AnalyticsTracker from './components/AnalyticsTracker'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import DashboardPage from './pages/DashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import LessonPage from './pages/LessonPage'
import { LoginPage, SignupPage } from './pages/AuthPages'

function RoutedApp() {
  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/courses" replace />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route element={<AuthRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="lessons/:id" element={<LessonPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="admin" element={<AdminDashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return <AuthProvider><RoutedApp /></AuthProvider>
}
