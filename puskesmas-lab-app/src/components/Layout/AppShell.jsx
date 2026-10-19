import { useState } from 'react'
import { FiChevronLeft, FiLogOut, FiMenu } from 'react-icons/fi'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getStoredAuth } from '../../utils/auth'

function AppShell({ role, title, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = getStoredAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    localStorage.removeItem('puskesmas_lab_auth')
    navigate('/login', { replace: true })
  }

  const menuItems = {
    admin: [
      { label: 'Dashboard', path: '/admin' },
      { label: 'Manajemen User', path: '/admin/users' },
      { label: 'Kategori Tes', path: '/admin/kategori' },
      { label: 'Parameter Tes', path: '/admin/parameter' },
    ],
    analis: [
      { label: 'Dashboard', path: '/analis' },
      { label: 'Pasien', path: '/analis/pasien' },
      { label: 'Order Pemeriksaan', path: '/analis/order' },
      { label: 'Input Hasil', path: '/analis/hasil' },
    ],
    dokter: [
      { label: 'Dashboard', path: '/dokter' },
      { label: 'Validasi Hasil', path: '/dokter/validasi' },
      { label: 'Riwayat Pasien', path: '/dokter/riwayat' },
    ],
  }

  const currentUser = auth?.user || { username: 'User', role }
  const isActiveLink = (path) => location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path))

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <button
        type="button"
        className={`sidebar-trigger ${sidebarOpen ? 'hidden' : ''}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Buka sidebar"
      >
        <FiMenu />
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark">+</span>
            <div>
              <strong>Puskesmas Lab</strong>
              <small>{currentUser.username}</small>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
          >
            <FiChevronLeft />
          </button>
        </div>

        <div className="user-chip">
          <span className="dot" />
          {currentUser.role || role}
        </div>

        <nav className="nav">
          {menuItems[role].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActiveLink(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
            <span className="logout-btn__icon"><FiLogOut /></span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <span className="role-badge">{role.toUpperCase()}</span>
            <h2>{title}</h2>
          </div>
        </header>

        {children}
      </main>
    </div>
  )
}

export { AppShell }
export default AppShell
