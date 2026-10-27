import { useCallback, useEffect, useState } from 'react'
import {
  FiActivity,
  FiBell,
  FiCheckCircle,
  FiChevronLeft,
  FiClipboard,
  FiClock,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMenu,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { STORAGE_KEY, getStoredAuth } from '../../utils/auth'
import { buildApiUrl } from '../../utils/api'
import ProfilePhotoCropper from './ProfilePhotoCropper'

const navIcons = {
  '/admin': FiHome,
  '/admin/users': FiUsers,
  '/admin/kategori': FiGrid,
  '/admin/parameter': FiActivity,
  '/analis': FiHome,
  '/analis/pasien': FiUsers,
  '/analis/order': FiClipboard,
  '/analis/hasil': FiActivity,
  '/dokter': FiHome,
  '/dokter/validasi': FiCheckCircle,
  '/dokter/riwayat': FiClock,
}

const requestJson = async (path, options = {}) => {
  const auth = getStoredAuth()
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {}

  if (!response.ok) {
    throw new Error(data.message || `Permintaan gagal (${response.status}).`)
  }

  return data
}

function ProfileAvatar({ photo, name }) {
  const initials = String(name || '').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return (
    <span className="profile-avatar">
      {photo ? <img src={photo} alt="" /> : initials || <FiUser aria-hidden="true" />}
    </span>
  )
}

function AppShell({ role, title, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = getStoredAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profile, setProfile] = useState(() => auth?.user || {})
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileDraft, setProfileDraft] = useState({ username: '', nama_lengkap: '', foto_profil: null })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationError, setNotificationError] = useState('')

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
    demo: [
      { label: 'Dashboard', path: '/admin' },
      { label: 'Manajemen User', path: '/admin/users' },
      { label: 'Kategori Tes', path: '/admin/kategori' },
      { label: 'Parameter Tes', path: '/admin/parameter' },
      { label: 'Pasien', path: '/analis/pasien' },
      { label: 'Order Pemeriksaan', path: '/analis/order' },
      { label: 'Input Hasil', path: '/analis/hasil' },
      { label: 'Validasi Hasil', path: '/dokter/validasi' },
      { label: 'Riwayat Pasien', path: '/dokter/riwayat' },
    ],
  }

  const currentUser = auth?.user || { username: 'User', role }
  const displayRole = currentUser.role || role
  const navItems = menuItems[displayRole] || menuItems[role] || []
  const dashboardPaths = ['/admin', '/analis', '/dokter']
  const isActiveLink = (path) => location.pathname === path || (
    !dashboardPaths.includes(path) && location.pathname.startsWith(`${path}/`)
  )
  const displayName = profile.nama_lengkap || currentUser.nama_lengkap || currentUser.username || 'Pengguna'
  const displayUsername = profile.username || currentUser.username || 'user'
  const displayPhoto = profile.foto_profil || null

  const loadNotifications = useCallback(async () => {
    return requestJson('/api/notifications')
  }, [])

  useEffect(() => {
    if (!auth?.token) return undefined
    let active = true

    requestJson('/api/profile')
      .then((result) => {
        if (active && result.data) setProfile(result.data)
      })
      .catch(() => {})
    loadNotifications()
      .then((result) => {
        if (!active) return
        setNotifications(result.data || [])
        setUnreadCount(Number(result.unread_count) || 0)
      })
      .catch((error) => {
        if (active) setNotificationError(error.message)
      })
      .finally(() => {
        if (active) setNotificationLoading(false)
      })

    return () => { active = false }
  }, [auth?.token, loadNotifications])

  const handleOpenProfile = () => {
    setProfileDraft({
      username: displayUsername,
      nama_lengkap: displayName,
      foto_profil: displayPhoto,
    })
    setProfileError('')
    setNotificationsOpen(false)
    setProfileOpen(true)
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setProfileSaving(true)
    setProfileError('')

    try {
      const result = await requestJson('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileDraft),
      })
      const updatedProfile = result.data
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...stored,
        user: { ...(stored.user || {}), ...updatedProfile },
      }))
      setProfile(updatedProfile)
      setProfileOpen(false)
    } catch (error) {
      setProfileError(error.message)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.read_at) {
      try {
        await requestJson(`/api/notifications/${notification.id}/read`, { method: 'PATCH' })
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
        )))
        setUnreadCount((count) => Math.max(0, count - 1))
      } catch (error) {
        setNotificationError(error.message)
        return
      }
    }

    setNotificationsOpen(false)
    if (notification.href) navigate(notification.href)
  }

  const handleMarkAllRead = async () => {
    try {
      await requestJson('/api/notifications/read-all', { method: 'PATCH' })
      const readAt = new Date().toISOString()
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || readAt })))
      setUnreadCount(0)
      setNotificationError('')
    } catch (error) {
      setNotificationError(error.message)
    }
  }

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <button
        type="button"
        className={`sidebar-trigger ${sidebarOpen ? 'hidden' : ''}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Buka sidebar"
        aria-expanded={sidebarOpen}
      >
        <FiMenu />
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="brand">
            <img className="brand-mark" src="/ico.png" alt="" />
            <div>
              <strong>Puskesmas Lab</strong>
              <small>{currentUser.username}</small>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Ciutkan sidebar' : 'Perluas sidebar'}
            aria-expanded={sidebarOpen}
            title={sidebarOpen ? 'Ciutkan sidebar' : 'Perluas sidebar'}
          >
            <FiChevronLeft />
          </button>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = navIcons[item.path] || FiGrid

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActiveLink(item.path) ? 'active' : ''}`}
                title={item.label}
                aria-label={item.label}
              >
                <span className="nav-link__icon"><Icon aria-hidden="true" /></span>
                <span className="nav-link__label">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            aria-label="Keluar"
            title="Keluar"
          >
            <span className="logout-btn__icon"><FiLogOut /></span>
            <span className="sidebar-logout-label">Keluar</span>
          </button>
        </div>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <span className="topbar-role">
            <span className="topbar-role__dot" aria-hidden="true" />
            {displayRole.toUpperCase()}
          </span>
          <div className="topbar-actions">
            <div className="notification-control">
              <button
                type="button"
                className="topbar-icon-button"
                aria-label={unreadCount ? `Notifikasi, ${unreadCount} belum dibaca` : 'Notifikasi'}
                aria-expanded={notificationsOpen}
                onClick={() => {
                  const opening = !notificationsOpen
                  setNotificationsOpen(opening)
                  if (opening) {
                    setNotificationError('')
                    setNotificationLoading(true)
                    loadNotifications()
                      .then((result) => {
                        setNotifications(result.data || [])
                        setUnreadCount(Number(result.unread_count) || 0)
                        setNotificationError('')
                      })
                      .catch((error) => setNotificationError(error.message))
                      .finally(() => setNotificationLoading(false))
                  }
                }}
              >
                <FiBell aria-hidden="true" />
                {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <section className="notification-popover" aria-label="Notifikasi">
                  <div className="notification-popover-header">
                    <h3>Notifikasi</h3>
                    <button
                      type="button"
                      className="notification-read-all"
                      disabled={unreadCount === 0}
                      onClick={handleMarkAllRead}
                    >
                      Tandai dibaca
                    </button>
                  </div>
                  {notificationError && <p className="notification-message notification-error" role="alert">{notificationError}</p>}
                  {notificationError ? null : notificationLoading ? (
                    <p className="notification-message">Memuat notifikasi...</p>
                  ) : notifications.length === 0 ? (
                    <p className="notification-message">Belum ada notifikasi.</p>
                  ) : (
                    <ul className="notification-list">
                      {notifications.map((notification) => (
                        <li key={notification.id}>
                          <button
                            type="button"
                            className={`notification-item ${notification.read_at ? '' : 'unread'}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <span className="notification-item-title">{notification.title}</span>
                            <span className="notification-item-message">{notification.message}</span>
                            <time dateTime={notification.created_at}>
                              {new Date(notification.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                            </time>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
            <button type="button" className="profile-trigger" onClick={handleOpenProfile}>
              <ProfileAvatar photo={displayPhoto} name={displayName} />
              <span className="profile-identity">
                <strong>{displayName}</strong>
                <small>{displayUsername}</small>
              </span>
            </button>
          </div>
        </header>

        <div className="page-heading">
          <h2>{title}</h2>
        </div>

        {children}
      </main>

      {profileOpen && (
        <div className="modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setProfileOpen(false)
        }}>
          <section className="modal-card profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
            <div className="modal-header">
              <h3 id="profile-modal-title">Edit profil</h3>
              <button type="button" className="topbar-icon-button modal-close-button" aria-label="Tutup" onClick={() => setProfileOpen(false)}>
                <FiX aria-hidden="true" />
              </button>
            </div>
            <form className="profile-form" onSubmit={handleSaveProfile}>
              <ProfilePhotoCropper
                value={profileDraft.foto_profil}
                onChange={(foto_profil) => setProfileDraft((current) => ({ ...current, foto_profil }))}
              />
              <label className="profile-field">
                Nama
                <input
                  type="text"
                  maxLength={100}
                  value={profileDraft.nama_lengkap}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, nama_lengkap: event.target.value }))}
                  required
                />
              </label>
              <label className="profile-field">
                Username
                <input
                  type="text"
                  maxLength={50}
                  value={profileDraft.username}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, username: event.target.value }))}
                  required
                />
              </label>
              {profileError && <div className="modal-error" role="alert">{profileError}</div>}
              <div className="modal-actions">
                <button type="button" className="mini-button" onClick={() => setProfileOpen(false)}>Batal</button>
                <button type="submit" className="action-button" disabled={profileSaving || displayRole === 'demo'}>
                  {profileSaving ? 'Menyimpan...' : 'Simpan profil'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export { AppShell }
export default AppShell
