import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import AdminPage from './pages/Admin/AdminPage'
import AnalisPage from './pages/Analis/AnalisPage'
import DokterPage from './pages/Dokter/DokterPage'
import LoginPage from './pages/Auth/LoginPage'
import UnauthorizedPage from './pages/Common/UnauthorizedPage'
import { getRoleLandingPath, getStoredAuth } from './utils/auth'

const AuthGuard = () => {
  const auth = getStoredAuth()
  const location = useLocation()

  if (!auth) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

const RequireRole = ({ allowedRoles, children }) => {
  const auth = getStoredAuth()

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(auth.user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

function HomeRedirect() {
  const auth = getStoredAuth()

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getRoleLandingPath(auth.user?.role || 'admin')} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<AuthGuard />}>
        <Route
          path="/admin"
          element={
            <RequireRole allowedRoles={['admin']}>
              <AdminPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireRole allowedRoles={['admin']}>
              <AdminPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/kategori"
          element={
            <RequireRole allowedRoles={['admin']}>
              <AdminPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/parameter"
          element={
            <RequireRole allowedRoles={['admin']}>
              <AdminPage />
            </RequireRole>
          }
        />

        <Route
          path="/analis"
          element={
            <RequireRole allowedRoles={['analis']}>
              <AnalisPage />
            </RequireRole>
          }
        />
        <Route
          path="/analis/pasien"
          element={
            <RequireRole allowedRoles={['analis']}>
              <AnalisPage />
            </RequireRole>
          }
        />
        <Route
          path="/analis/order"
          element={
            <RequireRole allowedRoles={['analis']}>
              <AnalisPage />
            </RequireRole>
          }
        />
        <Route
          path="/analis/hasil"
          element={
            <RequireRole allowedRoles={['analis']}>
              <AnalisPage />
            </RequireRole>
          }
        />

        <Route
          path="/dokter"
          element={
            <RequireRole allowedRoles={['dokter']}>
              <DokterPage />
            </RequireRole>
          }
        />
        <Route
          path="/dokter/validasi"
          element={
            <RequireRole allowedRoles={['dokter']}>
              <DokterPage />
            </RequireRole>
          }
        />
        <Route
          path="/dokter/riwayat"
          element={
            <RequireRole allowedRoles={['dokter']}>
              <DokterPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
