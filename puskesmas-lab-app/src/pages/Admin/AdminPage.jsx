import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FiActivity, FiEdit3, FiGrid, FiPlus, FiSave, FiTrash2, FiUsers, FiX } from 'react-icons/fi'
import AppShell from '../../components/Layout/AppShell'
import AdminAnalytics from '../../components/UI/AdminAnalytics'
import SummaryMetric from '../../components/UI/SummaryMetric'
import {
  validateCategoryForm,
  validateParameterForm,
  validateUserForm,
} from '../../utils/adminValidation'
import { buildApiUrl } from '../../utils/api'
import { getStoredAuth } from '../../utils/auth'
import { usePageAlerts } from '../../hooks/usePageAlerts'

const emptyCategoryForm = {
  nama_kategori: '',
  deskripsi: '',
}

const emptyParameterForm = {
  kategori_id: '',
  nama_parameter: '',
  satuan: '',
  nilai_rujukan: '',
  min_pria: '',
  max_pria: '',
  min_wanita: '',
  max_wanita: '',
}

const emptyUserForm = {
  username: '',
  nama_lengkap: '',
  role: 'admin',
  password: '',
}

function AdminPage() {
  const location = useLocation()
  const isDashboard = location.pathname === '/admin'
  const isUsers = location.pathname === '/admin/users'
  const isKategori = location.pathname === '/admin/kategori'
  const isParameter = location.pathname === '/admin/parameter'

  const [userRows, setUserRows] = useState([])
  const [kategoriRows, setKategoriRows] = useState([])
  const [parameterRows, setParameterRows] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [categoryFormError, setCategoryFormError] = useState('')
  const [parameterFormError, setParameterFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)
  const [parameterForm, setParameterForm] = useState(emptyParameterForm)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [userFormError, setUserFormError] = useState('')
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [parameterModalOpen, setParameterModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState(null)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingParameterId, setEditingParameterId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const auth = getStoredAuth()
  const token = auth?.token
  const currentUserId = auth?.user?.id
  const isDemoUser = auth?.user?.role === 'demo'

  const fetchAuthJson = async (url, options = {}) => {
    const auth = getStoredAuth()
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }

    if (auth?.token) {
      headers.Authorization = `Bearer ${auth.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'Permintaan gagal')
    }

    return data
  }

  const loadUsers = useCallback(async () => {
    if (!token) return

    setUserLoading(true)
    setError('')

    try {
      const data = await fetchAuthJson(buildApiUrl('/api/users'))
      const rows = (data.data || data || []).map((user) => ({
        id: user.id,
        username: user.username,
        nama: user.nama_lengkap || user.nama || user.username,
        role: user.role,
      }))
      setUserRows(rows)
    } catch (err) {
      setError(err.message)
    } finally {
      setUserLoading(false)
    }
  }, [token])

  const loadMasterData = useCallback(async () => {
    if (!token) {
      setError('Sesi login belum aktif. Silakan masuk kembali.')
      return
    }

    setLoading(true)
    if (isDashboard) setAnalyticsLoading(true)
    setError('')

    try {
      const [data, analyticsResult] = await Promise.all([
        fetchAuthJson(buildApiUrl('/api/master')),
        isDashboard ? fetchAuthJson(buildApiUrl('/api/dashboard/analytics')) : Promise.resolve(null),
      ])
      setKategoriRows(data.kategori || [])
      setParameterRows(data.parameter || [])
      if (analyticsResult) setAnalytics(analyticsResult.data)

      if ((data.kategori || []).length > 0 && !parameterForm.kategori_id) {
        setParameterForm((current) => ({
          ...current,
          kategori_id: String(data.kategori[0].id),
        }))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      if (isDashboard) setAnalyticsLoading(false)
    }
  }, [isDashboard, parameterForm.kategori_id, token])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers()
      void loadMasterData()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadMasterData, loadUsers])

  usePageAlerts([
    () => setError(''),
    () => setSuccessMessage(''),
    () => setCategoryFormError(''),
    () => setParameterFormError(''),
    () => setUserFormError(''),
    () => setDeleteTarget(null),
  ])

  const handleCategoryChange = (event) => {
    const { name, value } = event.target
    setCategoryForm((current) => ({ ...current, [name]: value }))
  }

  const handleParameterChange = (event) => {
    const { name, value } = event.target
    setParameterForm((current) => ({ ...current, [name]: value }))
  }

  const handleUserFormChange = (event) => {
    const { name, value } = event.target
    setUserForm((current) => ({ ...current, [name]: value }))
  }

  const closeUserModal = () => {
    setUserModalOpen(false)
    setEditingUserId(null)
    setUserForm(emptyUserForm)
    setUserFormError('')
  }

  const openCreateUserModal = () => {
    setEditingUserId(null)
    setUserForm(emptyUserForm)
    setUserFormError('')
    setUserModalOpen(true)
  }

  const openEditUserModal = (user) => {
    setEditingUserId(user.id)
    setUserForm({
      username: user.username,
      nama_lengkap: user.nama || user.nama_lengkap || '',
      role: user.role || 'admin',
      password: '',
    })
    setUserFormError('')
    setUserModalOpen(true)
  }

  const handleUserSubmit = async (event) => {
    event.preventDefault()

    const trimmedPassword = String(userForm.password || '').trim()
    const validationMessage = validateUserForm({
      ...userForm,
      password: trimmedPassword,
      isCreate: !editingUserId,
    })
    if (validationMessage) {
      setUserFormError(validationMessage)
      return
    }

    if (editingUserId && trimmedPassword && trimmedPassword.length < 6) {
      setUserFormError('Password minimal 6 karakter.')
      return
    }

    try {
      if (editingUserId) {
        const data = await fetchAuthJson(buildApiUrl(`/api/users/${editingUserId}`), {
          method: 'PUT',
          body: JSON.stringify({
            username: userForm.username.trim(),
            nama_lengkap: userForm.nama_lengkap.trim(),
            role: userForm.role.trim(),
          }),
        })

        if (trimmedPassword) {
          await fetchAuthJson(buildApiUrl(`/api/users/${editingUserId}/reset-password`), {
            method: 'POST',
            body: JSON.stringify({ new_password: trimmedPassword }),
          })
        }

        setUserRows((current) => current.map((user) => (user.id === editingUserId ? {
          ...user,
          username: data.data.username,
          nama: data.data.nama_lengkap,
          role: data.data.role,
        } : user)))
        setSuccessMessage(trimmedPassword
          ? `Data user "${data.data.username}" berhasil diperbarui dan password direset.`
          : `Data user "${data.data.username}" berhasil diperbarui.`)
      } else {
        const data = await fetchAuthJson(buildApiUrl('/api/auth/register'), {
          method: 'POST',
          body: JSON.stringify({
            username: userForm.username.trim(),
            password: trimmedPassword,
            role: userForm.role.trim(),
            nama_lengkap: userForm.nama_lengkap.trim(),
          }),
        })

        const createdUser = data.user || data.data
        setUserRows((current) => [{
          id: createdUser.id,
          username: createdUser.username,
          nama: createdUser.nama_lengkap || createdUser.nama || createdUser.username,
          role: createdUser.role,
        }, ...current])
        setSuccessMessage(`User "${createdUser.username}" berhasil dibuat.`)
      }

      closeUserModal()
    } catch (err) {
      setUserFormError(err.message)
    }
  }

  const openCategoryModal = (category = null) => {
    setEditingCategoryId(category?.id || null)
    setCategoryForm(category ? {
      nama_kategori: category.nama_kategori || '',
      deskripsi: category.deskripsi || '',
    } : emptyCategoryForm)
    setCategoryFormError('')
    setCategoryModalOpen(true)
  }

  const closeCategoryModal = () => {
    setCategoryModalOpen(false)
    setEditingCategoryId(null)
    setCategoryForm(emptyCategoryForm)
    setCategoryFormError('')
  }

  const handleCategorySubmit = async (event) => {
    event.preventDefault()

    const validationMessage = validateCategoryForm(categoryForm)
    if (validationMessage) {
      setCategoryFormError(validationMessage)
      return
    }

    setSubmitting(true)
    setError('')
    setCategoryFormError('')
    setSuccessMessage('')

    try {
      const payload = {
        nama_kategori: categoryForm.nama_kategori.trim(),
        deskripsi: categoryForm.deskripsi.trim(),
      }

      if (editingCategoryId) {
        const data = await fetchAuthJson(buildApiUrl(`/api/kategori-tes/${editingCategoryId}`), {
          method: 'PUT',
          body: JSON.stringify(payload),
        })

        setKategoriRows((current) => current.map((row) => row.id === editingCategoryId ? data.data : row))
        setSuccessMessage(`Kategori "${data.data.nama_kategori}" berhasil diperbarui.`)
      } else {
        const data = await fetchAuthJson(buildApiUrl('/api/kategori-tes'), {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        setKategoriRows((current) => [data.data, ...current])
        setSuccessMessage(`Kategori "${data.data.nama_kategori}" berhasil ditambahkan.`)
      }

      closeCategoryModal()
    } catch (err) {
      setCategoryFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openParameterModal = (parameter = null) => {
    setEditingParameterId(parameter?.id || null)
    setParameterForm(parameter ? {
      kategori_id: String(parameter.kategori_id || ''),
      nama_parameter: parameter.nama_parameter || '',
      satuan: parameter.satuan || '',
      nilai_rujukan: parameter.nilai_rujukan || '',
      min_pria: parameter.min_pria ?? '',
      max_pria: parameter.max_pria ?? '',
      min_wanita: parameter.min_wanita ?? '',
      max_wanita: parameter.max_wanita ?? '',
    } : {
      ...emptyParameterForm,
      kategori_id: kategoriRows[0]?.id ? String(kategoriRows[0].id) : '',
    })
    setParameterFormError('')
    setParameterModalOpen(true)
  }

  const closeParameterModal = () => {
    setParameterModalOpen(false)
    setEditingParameterId(null)
    setParameterForm({
      ...emptyParameterForm,
      kategori_id: kategoriRows[0]?.id ? String(kategoriRows[0].id) : '',
    })
    setParameterFormError('')
  }

  const handleParameterSubmit = async (event) => {
    event.preventDefault()

    const validationMessage = validateParameterForm(parameterForm)
    if (validationMessage) {
      setParameterFormError(validationMessage)
      return
    }

    setSubmitting(true)
    setError('')
    setParameterFormError('')
    setSuccessMessage('')

    try {
      const payload = {
        kategori_id: Number(parameterForm.kategori_id),
        nama_parameter: parameterForm.nama_parameter.trim(),
        satuan: parameterForm.satuan.trim(),
        nilai_rujukan: parameterForm.nilai_rujukan.trim(),
        min_pria: parameterForm.min_pria === '' ? null : Number(parameterForm.min_pria),
        max_pria: parameterForm.max_pria === '' ? null : Number(parameterForm.max_pria),
        min_wanita: parameterForm.min_wanita === '' ? null : Number(parameterForm.min_wanita),
        max_wanita: parameterForm.max_wanita === '' ? null : Number(parameterForm.max_wanita),
      }

      if (editingParameterId) {
        const data = await fetchAuthJson(buildApiUrl(`/api/parameter-tes/${editingParameterId}`), {
          method: 'PUT',
          body: JSON.stringify(payload),
        })

        setParameterRows((current) => current.map((row) => row.id === editingParameterId ? data.data : row))
        setSuccessMessage(`Parameter "${data.data.nama_parameter}" berhasil diperbarui.`)
      } else {
        const data = await fetchAuthJson(buildApiUrl('/api/parameter-tes'), {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        setParameterRows((current) => [data.data, ...current])
        setSuccessMessage(`Parameter "${data.data.nama_parameter}" berhasil ditambahkan.`)
      }

      closeParameterModal()
    } catch (err) {
      setParameterFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!userId) return
    if (userId === currentUserId) {
      setError('Anda tidak dapat menghapus akun aktif saat ini.')
      return
    }

    setDeleteTarget({ type: 'user', id: userId, label: 'user' })
  }

  const handleDeleteCategory = (category) => {
    setDeleteTarget({ type: 'category', id: category.id, label: category.nama_kategori })
  }

  const handleDeleteParameter = (parameter) => {
    setDeleteTarget({ type: 'parameter', id: parameter.id, label: parameter.nama_parameter })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === 'user') {
        await fetchAuthJson(buildApiUrl(`/api/users/${deleteTarget.id}`), { method: 'DELETE' })
        setUserRows((current) => current.filter((user) => user.id !== deleteTarget.id))
        setSuccessMessage('User berhasil dihapus.')
      }

      if (deleteTarget.type === 'category') {
        await fetchAuthJson(buildApiUrl(`/api/kategori-tes/${deleteTarget.id}`), { method: 'DELETE' })
        setKategoriRows((current) => current.filter((row) => row.id !== deleteTarget.id))
        setSuccessMessage(`Kategori "${deleteTarget.label}" berhasil dihapus.`)
      }

      if (deleteTarget.type === 'parameter') {
        await fetchAuthJson(buildApiUrl(`/api/parameter-tes/${deleteTarget.id}`), { method: 'DELETE' })
        setParameterRows((current) => current.filter((row) => row.id !== deleteTarget.id))
        setSuccessMessage(`Parameter "${deleteTarget.label}" berhasil dihapus.`)
      }

      setDeleteTarget(null)
    } catch (err) {
      setError(err.message)
      setDeleteTarget(null)
    }
  }

  const pageTitle = isDashboard ? 'Dashboard Admin' : isUsers ? 'Manajemen User' : isKategori ? 'Kategori Tes' : 'Parameter Tes'

  return (
    <AppShell
      role="admin"
      title={pageTitle}
      description="Kelola pengguna, kategori tes, dan parameter referensi laboratorium."
      accentClass="admin"
    >
      {isDemoUser && (
        <div className="error-box" style={{ marginBottom: '1rem' }}>
          Akun demo hanya bisa melihat data. Fitur tambah, edit, dan hapus tidak tersedia untuk role ini.
        </div>
      )}

      {isDashboard ? (
        <div className="dashboard-summary">
          <div className="dashboard-summary-heading">
            <h3>Operasional Laboratorium</h3>
          </div>
          <div className="summary-grid">
            <SummaryMetric icon={FiActivity} label="Pemeriksaan Hari Ini" value={analyticsLoading ? '—' : analytics?.summary?.pemeriksaan_hari_ini ?? 0} tone="admin" />
            <SummaryMetric icon={FiUsers} label="Menunggu Validasi" value={analyticsLoading ? '—' : analytics?.summary?.menunggu_validasi ?? 0} tone="admin" />
            <SummaryMetric icon={FiGrid} label="Perlu Revisi" value={analyticsLoading ? '—' : analytics?.summary?.perlu_revisi ?? 0} tone="admin" />
            <SummaryMetric icon={FiActivity} label="Hasil Abnormal · 30 hari" value={analyticsLoading ? '—' : analytics?.summary?.hasil_abnormal_30_hari ?? 0} tone="admin" />
          </div>
          <AdminAnalytics data={analytics} loading={analyticsLoading} error={error} />
        </div>
      ) : (
        <div className="panel-stack">
          {(isUsers) && (
            <section className="panel">
            <div className="panel-header">
              <h3>Manajemen Pengguna</h3>
              {!isDemoUser && (
                <button className="action-button primary" type="button" onClick={openCreateUserModal}>
                  <span className="action-button__icon"><FiPlus /></span>
                  <span>Tambah User</span>
                </button>
              )}
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Nama Lengkap</th>
                    <th>Role</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {userLoading ? (
                    <tr>
                      <td colSpan="4">Memuat data user...</td>
                    </tr>
                  ) : userRows.length > 0 ? (
                    userRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.username}</td>
                        <td>{row.nama}</td>
                        <td><span className={`badge role-${row.role.toLowerCase()}`}>{row.role}</span></td>
                        <td>
                          {!isDemoUser ? (
                            <div className="action-cell">
                              <button className="mini-button" type="button" onClick={() => openEditUserModal(row)} title="Edit user">
                                <span className="action-button__icon"><FiEdit3 /></span>
                                <span>Edit</span>
                              </button>
                            </div>
                          ) : (
                            <span className="status-pill neutral">Read only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">Belum ada data user.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

            {(isKategori || isParameter) && (
              <section className="panel-stack">
                {isKategori ? (
                <div className="panel">
                <div className="panel-header">
                  <h3>Kategori Tes</h3>
                  {!isDemoUser && (
                    <button className="action-button primary" type="button" onClick={() => openCategoryModal()}>
                      <span className="action-button__icon"><FiPlus /></span>
                      <span>Tambah Kategori</span>
                    </button>
                  )}
                </div>

                {error && <div className="error-box">{error}</div>}
                {successMessage && <div className="success-box">{successMessage}</div>}

                <div className="table-scroll">
                  <table className="data-table compact-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nama Kategori</th>
                        <th>Deskripsi</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="4">Memuat data...</td></tr>
                      ) : kategoriRows.length ? (
                        kategoriRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.id}</td>
                            <td>{row.nama_kategori}</td>
                            <td>{row.deskripsi || '-'}</td>
                            <td>
                              {!isDemoUser ? (
                                <div className="action-cell">
                                  <button className="mini-button" type="button" onClick={() => openCategoryModal(row)} title="Edit kategori">
                                    <span className="action-button__icon"><FiEdit3 /></span>
                                    <span>Edit</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="status-pill neutral">Read only</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4">Belum ada data kategori.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                  </div>
                ) : null}

                {isParameter ? (
                  <div className="panel">
                <div className="panel-header">
                  <h3>Parameter Tes</h3>
                  {!isDemoUser && (
                    <button className="action-button primary" type="button" onClick={() => openParameterModal()}>
                      <span className="action-button__icon"><FiPlus /></span>
                      <span>Tambah Parameter</span>
                    </button>
                  )}
                </div>

                <div className="table-scroll">
                  <table className="data-table compact-table">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>Kategori</th>
                        <th>Satuan</th>
                        <th>Pria</th>
                        <th>Wanita</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6">Memuat data...</td></tr>
                      ) : parameterRows.length ? (
                        parameterRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.nama_parameter}</td>
                            <td>{kategoriRows.find((item) => item.id === row.kategori_id)?.nama_kategori || '-'}</td>
                            <td>{row.satuan || '-'}</td>
                            <td>{row.min_pria != null && row.max_pria != null ? `${row.min_pria}-${row.max_pria}` : '-'}</td>
                            <td>{row.min_wanita != null && row.max_wanita != null ? `${row.min_wanita}-${row.max_wanita}` : '-'}</td>
                            <td>
                              {!isDemoUser ? (
                                <div className="action-cell">
                                  <button className="mini-button" type="button" onClick={() => openParameterModal(row)} title="Edit parameter">
                                    <span className="action-button__icon"><FiEdit3 /></span>
                                    <span>Edit</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="status-pill neutral">Read only</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6">Belum ada data parameter.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                  </div>
                ) : null}
              </section>
            )}
        </div>
      )}

      {userModalOpen && (
        <div className="modal-overlay" onClick={closeUserModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUserId ? 'Edit User' : 'Tambah User'}</h3>
              <button type="button" className="mini-button" onClick={closeUserModal}>
                <span className="action-button__icon"><FiX /></span><span>Tutup</span>
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="form-grid modal-form">
              <label className="field">
                <span>Username</span>
                <input name="username" value={userForm.username} onChange={handleUserFormChange} />
              </label>
              <label className="field">
                <span>Nama Lengkap</span>
                <input name="nama_lengkap" value={userForm.nama_lengkap} onChange={handleUserFormChange} />
              </label>
              <label className="field">
                <span>Role</span>
                <select name="role" value={userForm.role} onChange={handleUserFormChange}>
                  <option value="admin">Admin</option>
                  <option value="analis">Analis</option>
                  <option value="dokter">Dokter</option>
                  <option value="demo">Demo</option>
                </select>
              </label>
              <label className="field">
                <span>{editingUserId ? 'Password Baru (opsional)' : 'Password'}</span>
                <input
                  type="password"
                  name="password"
                  value={userForm.password}
                  onChange={handleUserFormChange}
                  placeholder={editingUserId ? 'Kosongkan bila tidak ingin mengganti password' : 'Minimal 6 karakter'}
                />
              </label>

              {userFormError && <div className="error-box">{userFormError}</div>}

              <div className="modal-actions">
                <button type="button" className="mini-button" onClick={closeUserModal}>
                  <span className="action-button__icon"><FiX /></span><span>Batal</span>
                </button>
                {editingUserId && (
                  <button
                    type="button"
                    className="mini-button danger"
                    onClick={() => handleDeleteUser(editingUserId)}
                    disabled={editingUserId === currentUserId}
                  >
                    <span className="action-button__icon"><FiTrash2 /></span>
                    <span>Hapus User</span>
                  </button>
                )}
                <button type="submit" className="action-button primary">
                  <span className="action-button__icon">{editingUserId ? <FiSave /> : <FiPlus />}</span>
                  <span>{editingUserId ? 'Simpan Perubahan' : 'Tambah User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div className="modal-overlay" onClick={closeCategoryModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategoryId ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button type="button" className="mini-button" onClick={closeCategoryModal}>
                <span className="action-button__icon"><FiX /></span><span>Tutup</span>
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="form-grid modal-form">
              <label className="field">
                <span>Nama Kategori</span>
                <input name="nama_kategori" value={categoryForm.nama_kategori} onChange={handleCategoryChange} placeholder="Contoh: Hematologi" />
              </label>
              <label className="field">
                <span>Deskripsi</span>
                <input name="deskripsi" value={categoryForm.deskripsi} onChange={handleCategoryChange} placeholder="Opsional" />
              </label>

              {categoryFormError && <div className="error-box">{categoryFormError}</div>}

              <div className="modal-actions">
                <div className="modal-actions__left">
                  {editingCategoryId && (
                    <button
                      type="button"
                      className="mini-button danger"
                      onClick={() => handleDeleteCategory({ id: editingCategoryId, nama_kategori: categoryForm.nama_kategori })}
                    >
                      <span className="action-button__icon"><FiTrash2 /></span>
                      <span>Hapus Kategori</span>
                    </button>
                  )}
                </div>

                <div className="modal-actions__right">
                  <button type="button" className="mini-button" onClick={closeCategoryModal}>
                    <span className="action-button__icon"><FiX /></span><span>Batal</span>
                  </button>
                  <button type="submit" className="action-button primary" disabled={submitting}>
                    <span className="action-button__icon"><FiSave /></span>
                    {submitting ? 'Menyimpan...' : (editingCategoryId ? 'Simpan Perubahan' : 'Tambah Kategori')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {parameterModalOpen && (
        <div className="modal-overlay" onClick={closeParameterModal}>
          <div className="modal-card modal-card-wide" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingParameterId ? 'Edit Parameter' : 'Tambah Parameter'}</h3>
              <button type="button" className="mini-button" onClick={closeParameterModal}>
                <span className="action-button__icon"><FiX /></span><span>Tutup</span>
              </button>
            </div>

            <form onSubmit={handleParameterSubmit} className="form-grid modal-form modal-form-grid">
              <label className="field">
                <span>Kategori</span>
                <select name="kategori_id" value={parameterForm.kategori_id} onChange={handleParameterChange}>
                  {kategoriRows.map((item) => (
                    <option key={item.id} value={item.id}>{item.nama_kategori}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Nama Parameter</span>
                <input name="nama_parameter" value={parameterForm.nama_parameter} onChange={handleParameterChange} placeholder="Contoh: Hemoglobin" />
              </label>
              <label className="field">
                <span>Satuan</span>
                <input name="satuan" value={parameterForm.satuan} onChange={handleParameterChange} placeholder="g/dL" />
              </label>
              <label className="field">
                <span>Nilai Rujukan</span>
                <input name="nilai_rujukan" value={parameterForm.nilai_rujukan} onChange={handleParameterChange} placeholder="12-15" />
              </label>
              <label className="field">
                <span>Min Pria</span>
                <input name="min_pria" type="number" value={parameterForm.min_pria} onChange={handleParameterChange} />
              </label>
              <label className="field">
                <span>Max Pria</span>
                <input name="max_pria" type="number" value={parameterForm.max_pria} onChange={handleParameterChange} />
              </label>
              <label className="field">
                <span>Min Wanita</span>
                <input name="min_wanita" type="number" value={parameterForm.min_wanita} onChange={handleParameterChange} />
              </label>
              <label className="field">
                <span>Max Wanita</span>
                <input name="max_wanita" type="number" value={parameterForm.max_wanita} onChange={handleParameterChange} />
              </label>

              {parameterFormError && <div className="error-box modal-error">{parameterFormError}</div>}

              <div className="modal-actions modal-actions-full">
                <div className="modal-actions__left">
                  {editingParameterId && (
                    <button
                      type="button"
                      className="mini-button danger"
                      onClick={() => handleDeleteParameter({ id: editingParameterId, nama_parameter: parameterForm.nama_parameter })}
                    >
                      <span className="action-button__icon"><FiTrash2 /></span>
                      <span>Hapus Parameter</span>
                    </button>
                  )}
                </div>

                <div className="modal-actions__right">
                  <button type="button" className="mini-button" onClick={closeParameterModal}>
                    <span className="action-button__icon"><FiX /></span><span>Batal</span>
                  </button>
                  <button type="submit" className="action-button primary" disabled={submitting}>
                    <span className="action-button__icon"><FiSave /></span>
                    {submitting ? 'Menyimpan...' : (editingParameterId ? 'Simpan Perubahan' : 'Tambah Parameter')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card modal-confirm" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Konfirmasi Hapus</h3>
            </div>
            <p>Apakah Anda yakin ingin menghapus {deleteTarget.label}?</p>
            <div className="modal-actions">
              <div className="modal-actions__left" />
              <div className="modal-actions__right">
                <button type="button" className="mini-button" onClick={() => setDeleteTarget(null)}>
                  <span className="action-button__icon"><FiX /></span><span>Batal</span>
                </button>
                <button type="button" className="action-button danger" onClick={confirmDelete}>
                  <span className="action-button__icon"><FiTrash2 /></span><span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default AdminPage
