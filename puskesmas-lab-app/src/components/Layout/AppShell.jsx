import { Link, useNavigate } from 'react-router-dom'
import { getStoredAuth } from '../../utils/auth'

function AppShell({ role, title, description, accentClass = 'admin', children }) {
  const navigate = useNavigate()
  const auth = getStoredAuth()

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">+</span>
          <div>
            <strong>Puskesmas Lab</strong>
            <small>{currentUser.username}</small>
          </div>
        </div>

        <nav className="nav">
          {menuItems[role].map((item) => (
            <Link key={item.path} to={item.path} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <span className="role-badge">{role.toUpperCase()}</span>
            <h2>{title}</h2>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Keluar</button>
        </header>

        <section className="page-intro">
          <p>{description}</p>
        </section>

        <div className="stats-grid">
          <div className={`stat-card ${accentClass}`}>
            <span>Jumlah Data</span>
            <strong>24</strong>
          </div>
          <div className={`stat-card ${accentClass}`}>
            <span>Butuh Tindakan</span>
            <strong>8</strong>
          </div>
          <div className={`stat-card ${accentClass}`}>
            <span>Status Hari Ini</span>
            <strong>OK</strong>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}

export default AppShell
