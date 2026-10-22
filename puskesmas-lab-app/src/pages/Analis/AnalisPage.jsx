import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FiCheck, FiPlus } from 'react-icons/fi'
import AppShell from '../../components/Layout/AppShell'
import { usePageAlerts } from '../../hooks/usePageAlerts'
import { buildApiUrl } from '../../utils/api'
import { getStoredAuth } from '../../utils/auth'

const emptyPatientForm = {
  nik: '',
  nama_pasien: '',
  tanggal_lahir: '',
  jenis_kelamin: 'L',
  alamat: '',
  no_hp: '',
}

const emptyOrderForm = {
  pasien_id: '',
  kategori_id: '',
  is_cito: false,
}

const statusLabel = {
  menunggu: 'Menunggu',
  proses: 'Proses',
  menunggu_validasi: 'Menunggu Validasi',
  revisi: 'Revisi',
  selesai: 'Selesai',
}

const formatAge = (tanggalLahir) => {
  if (!tanggalLahir) return '-'

  const birthDate = new Date(tanggalLahir)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return `${Math.max(age, 0)} tahun`
}

function AnalisPage() {
  const location = useLocation()
  const isDashboard = location.pathname === '/analis'
  const isPasien = location.pathname === '/analis/pasien'
  const isOrder = location.pathname === '/analis/order'
  const isHasil = location.pathname === '/analis/hasil'

  const auth = getStoredAuth()
  const token = auth?.token
  const currentUserId = auth?.user?.id
  const isDemoUser = auth?.user?.role === 'demo'

  const [patients, setPatients] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [resultOrders, setResultOrders] = useState([])
  const [selectedResultOrderId, setSelectedResultOrderId] = useState('')
  const [resultParameters, setResultParameters] = useState([])
  const [resultValues, setResultValues] = useState({})
  const [savingResult, setSavingResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [patientModalOpen, setPatientModalOpen] = useState(false)
  const [patientForm, setPatientForm] = useState(emptyPatientForm)
  const [orderForm, setOrderForm] = useState(emptyOrderForm)

  const fetchAuthJson = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const text = await response.text()
    let data = {}

    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      if (response.status === 405) {
        throw new Error(`Endpoint tidak diizinkan (${response.status}). Cek route API di Vercel.`)
      }

      throw new Error(data.message || 'Respons API bukan JSON. Cek apakah endpoint aktif.')
    }

    if (!response.ok) {
      throw new Error(data.message || `Permintaan gagal (${response.status})`)
    }

    return data
  }

  const loadPatients = useCallback(async () => {
    if (!token) return

    try {
      const data = await fetchAuthJson(buildApiUrl('/api/pasien'))
      setPatients(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      setError(err.message)
    }
  }, [token])

  const loadCategories = useCallback(async () => {
    if (!token) return

    try {
      const data = await fetchAuthJson(buildApiUrl('/api/kategori-tes'))
      const rows = Array.isArray(data) ? data : data.data || []
      setCategories(rows)
      setOrderForm((current) => ({
        ...current,
        kategori_id: current.kategori_id || (rows[0]?.id ? String(rows[0].id) : ''),
      }))
    } catch (err) {
      setError(err.message)
    }
  }, [token])

  const loadOrders = useCallback(async () => {
    if (!token) return

    try {
      const data = await fetchAuthJson(buildApiUrl('/api/pemeriksaan'))
      const rows = Array.isArray(data) ? data : data.data || []
      const activeRows = rows.filter((item) => item.status !== 'selesai')
      const parameterizedRows = activeRows.filter((item) => item.kategori_id)

      setOrders(rows)
      setResultOrders(parameterizedRows)

      if (!selectedResultOrderId && parameterizedRows.length > 0) {
        setSelectedResultOrderId(String(parameterizedRows[0].id))
      }
    } catch (err) {
      setError(err.message)
    }
  }, [selectedResultOrderId, token])

  const loadResultParameters = useCallback(async (orderId) => {
    if (!orderId || !token) {
      setResultParameters([])
      return
    }

    const targetOrder = resultOrders.find((item) => String(item.id) === String(orderId)) || orders.find((item) => String(item.id) === String(orderId))

    if (!targetOrder?.kategori_id) {
      setResultParameters([])
      return
    }

    try {
      const params = await fetchAuthJson(buildApiUrl(`/api/kategori-tes/${targetOrder.kategori_id}/parameter`))
      const paramRows = Array.isArray(params) ? params : params.data || []

      setResultParameters(paramRows)
      setResultValues(
        Object.fromEntries(
          paramRows.map((parameter) => [
            String(parameter.id),
            { nilai_hasil: '', catatan: '' },
          ])
        )
      )
    } catch (err) {
      setError(err.message)
    }
  }, [orders, resultOrders, token])

  const loadData = useCallback(async () => {
    if (!token) {
      setError('Sesi login belum aktif. Silakan masuk kembali.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await Promise.all([loadPatients(), loadCategories(), loadOrders()])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [loadCategories, loadOrders, loadPatients, token])

  useEffect(() => {
    void loadData()
  }, [loadData])

  usePageAlerts([
    () => setError(''),
    () => setSuccessMessage(''),
  ])

  useEffect(() => {
    if (selectedResultOrderId) {
      void loadResultParameters(selectedResultOrderId)
    }
  }, [loadResultParameters, selectedResultOrderId])

  const handlePatientFormChange = (event) => {
    const { name, value } = event.target
    setPatientForm((current) => ({ ...current, [name]: value }))
  }

  const handleOrderFormChange = (event) => {
    const { name, value, type, checked } = event.target
    setOrderForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const closePatientModal = () => {
    setPatientModalOpen(false)
    setPatientForm(emptyPatientForm)
    setError('')
  }

  const handlePatientSubmit = async (event) => {
    event.preventDefault()

    try {
      await fetchAuthJson(buildApiUrl('/api/pasien'), {
        method: 'POST',
        body: JSON.stringify({
          nik: patientForm.nik.trim(),
          nama_pasien: patientForm.nama_pasien.trim(),
          tanggal_lahir: patientForm.tanggal_lahir,
          jenis_kelamin: patientForm.jenis_kelamin,
          alamat: patientForm.alamat.trim(),
          no_hp: patientForm.no_hp.trim(),
        }),
      })

      setSuccessMessage('Pasien baru berhasil ditambahkan.')
      closePatientModal()
      await loadPatients()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleOrderSubmit = async (event) => {
    event.preventDefault()

    if (!orderForm.pasien_id || !orderForm.kategori_id) {
      setError('Pilih pasien dan kategori tes terlebih dahulu.')
      return
    }

    try {
      await fetchAuthJson(buildApiUrl('/api/pemeriksaan'), {
        method: 'POST',
        body: JSON.stringify({
          pasien_id: Number(orderForm.pasien_id),
          kategori_id: Number(orderForm.kategori_id),
          analis_id: currentUserId,
          is_cito: Boolean(orderForm.is_cito),
          status: 'menunggu',
        }),
      })

      setSuccessMessage('Order pemeriksaan berhasil dibuat.')
      setOrderForm({
        pasien_id: '',
        kategori_id: categories[0]?.id ? String(categories[0].id) : '',
        is_cito: false,
      })
      await loadOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  const selectedResultOrder = resultOrders.find((item) => String(item.id) === String(selectedResultOrderId)) || orders.find((item) => String(item.id) === String(selectedResultOrderId)) || null

  const getParameterRange = (parameter, gender = selectedResultOrder?.jenis_kelamin || 'L') => {
    const min = gender === 'L' ? parameter.min_pria : parameter.min_wanita
    const max = gender === 'L' ? parameter.max_pria : parameter.max_wanita

    if (min != null || max != null) {
      return `${min ?? '-'} – ${max ?? '-'}`
    }

    return parameter.nilai_rujukan || 'Nilai referensi tidak tersedia'
  }

  const getResultIndicator = (parameter, value) => {
    const rawValue = value?.nilai_hasil
    if (!rawValue || rawValue.trim() === '') {
      return 'empty'
    }

    const numericValue = Number(rawValue)
    if (Number.isNaN(numericValue)) {
      return 'empty'
    }

    const gender = selectedResultOrder?.jenis_kelamin || 'L'
    const min = gender === 'L' ? parameter.min_pria : parameter.min_wanita
    const max = gender === 'L' ? parameter.max_pria : parameter.max_wanita

    if (min == null || max == null) {
      return 'normal'
    }

    return numericValue >= min && numericValue <= max ? 'normal' : 'abnormal'
  }

  const handleResultFieldChange = (parameterId, field, value) => {
    setResultValues((current) => ({
      ...current,
      [String(parameterId)]: {
        ...(current[String(parameterId)] || {}),
        [field]: value,
      },
    }))
  }

  const handleResultSubmit = async (event) => {
    event.preventDefault()

    if (!selectedResultOrderId) {
      setError('Pilih pemeriksaan yang akan diinput hasilnya.')
      return
    }

    const hasil = resultParameters
      .map((parameter) => {
        const entry = resultValues[String(parameter.id)] || {}
        const nilaiHasil = String(entry.nilai_hasil ?? '').trim()

        if (!nilaiHasil) {
          return null
        }

        return {
          parameter_id: parameter.id,
          nilai_hasil: nilaiHasil,
          catatan: String(entry.catatan ?? '').trim(),
        }
      })
      .filter(Boolean)

    if (hasil.length === 0) {
      setError('Masukkan minimal satu nilai hasil untuk pemeriksaan ini.')
      return
    }

    setSavingResult(true)
    setError('')

    try {
      await fetchAuthJson(buildApiUrl(`/api/pemeriksaan/${selectedResultOrderId}/hasil`), {
        method: 'POST',
        body: JSON.stringify({ hasil }),
      })

      setSuccessMessage('Hasil lab berhasil disimpan dan menunggu validasi dokter.')
      setSelectedResultOrderId('')
      await loadOrders()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingResult(false)
    }
  }

  const pageTitle = isDashboard ? 'Dashboard Analis' : isPasien ? 'Manajemen Pasien' : isOrder ? 'Order Pemeriksaan' : 'Input Hasil Lab'

  return (
    <AppShell
      role="analis"
      title={pageTitle}
      description="Input pemeriksaan dan simpan hasil dengan auto-flagging yang terintegrasi."
      accentClass="analis"
    >
      {isDemoUser && (
        <div className="error-box" style={{ marginBottom: '1rem' }}>
          Akun demo hanya bisa membaca data. Anda tidak dapat menambah pasien, membuat order, atau menyimpan hasil laboratorium.
        </div>
      )}

      {isDashboard ? (
        <div className="panel-stack dashboard-summary">
          <section className="panel">
            <div className="panel-header">
              <h3>Ringkasan Analis</h3>
            </div>
            <div className="summary-grid">
              <div className="summary-card analis">
                <span>Pasien Terdaftar</span>
                <strong>{patients.length}</strong>
              </div>
              <div className="summary-card analis">
                <span>Order Menunggu</span>
                <strong>{orders.filter((item) => item.status !== 'selesai').length}</strong>
              </div>
              <div className="summary-card analis">
                <span>Hasil Tersimpan</span>
                <strong>{orders.filter((item) => item.status === 'menunggu_validasi' || item.status === 'selesai').length}</strong>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="panel-stack">
          {isPasien && (
            <section className="panel">
              <div className="panel-header">
                <h3>Manajemen Pasien</h3>
                {!isDemoUser && (
                  <button type="button" className="action-button primary" onClick={() => setPatientModalOpen(true)}>
                    <span className="action-button__icon"><FiPlus /></span>
                    <span>Tambah Pasien</span>
                  </button>
                )}
              </div>

              {error && <div className="error-box">{error}</div>}
              {successMessage && <div className="success-box">{successMessage}</div>}

              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>NIK</th>
                      <th>Umur</th>
                      <th>Jenis Kelamin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4">Memuat data pasien...</td>
                      </tr>
                    ) : patients.length > 0 ? (
                      patients.map((row) => (
                        <tr key={row.id}>
                          <td>{row.nama_pasien}</td>
                          <td>{row.nik}</td>
                          <td>{formatAge(row.tanggal_lahir)}</td>
                          <td>{row.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">Belum ada data pasien.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {isOrder && (
            <section className="panel">
              <div className="panel-header">
                <h3>Order Pemeriksaan</h3>
              </div>

              {error && <div className="error-box">{error}</div>}
              {successMessage && <div className="success-box">{successMessage}</div>}

              <form onSubmit={handleOrderSubmit} className="form-grid">
                <label className="field">
                  <span>Pasien</span>
                  <select name="pasien_id" value={orderForm.pasien_id} onChange={handleOrderFormChange}>
                    <option value="">Pilih pasien</option>
                    {patients.map((item) => (
                      <option key={item.id} value={item.id}>{item.nama_pasien}</option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Kategori Tes</span>
                  <select name="kategori_id" value={orderForm.kategori_id} onChange={handleOrderFormChange}>
                    <option value="">Pilih kategori</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>{item.nama_kategori}</option>
                    ))}
                  </select>
                </label>

                <label className="checkbox-field">
                  <input type="checkbox" name="is_cito" checked={orderForm.is_cito} onChange={handleOrderFormChange} />
                  <span>Prioritas / CITO</span>
                </label>

                {!isDemoUser && (
                  <div className="action-row" style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" className="action-button primary">
                      <span className="action-button__icon"><FiPlus /></span>
                      <span>Buat Order</span>
                    </button>
                  </div>
                )}
              </form>

              <div className="table-scroll">
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>Pasien</th>
                      <th>Status</th>
                      <th>CITO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="3">Memuat order pemeriksaan...</td>
                      </tr>
                    ) : orders.length > 0 ? (
                      orders.map((row) => (
                        <tr key={row.id}>
                          <td>{row.nama_pasien || 'Pasien'}</td>
                          <td>{statusLabel[row.status] || row.status}</td>
                          <td>
                            {row.is_cito ? <span className="status-pill danger">CITO</span> : <span className="status-pill neutral">Biasa</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3">Belum ada order pemeriksaan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {isHasil && (
            <section className="panel">
              <div className="lab-header">
                <div>
                  <p className="section-kicker">Pemeriksaan</p>
                  <h3>Input Hasil Lab</h3>
                </div>
                <div className="lab-header-status">
                  <span className={`status-pill ${selectedResultOrder?.is_cito ? 'danger' : 'neutral'}`}>
                    {selectedResultOrder?.is_cito ? 'CITO' : 'Reguler'}
                  </span>
                  <span className="status-pill neutral">
                    {statusLabel[selectedResultOrder?.status] || 'Menunggu'}
                  </span>
                </div>
              </div>

              {error && <div className="error-box">{error}</div>}
              {successMessage && <div className="success-box">{successMessage}</div>}

              <div className="form-grid">
                <label className="field" style={{ gridColumn: '1 / -1' }}>
                  <span>Pemeriksaan</span>
                  <select value={selectedResultOrderId} onChange={(event) => setSelectedResultOrderId(event.target.value)}>
                    <option value="">Pilih pemeriksaan</option>
                    {resultOrders.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.nama_pasien} · {row.nama_kategori || 'Tes'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedResultOrder && (
                <div className="lab-identity">
                  <div className="meta-item">
                    <span>Pasien</span>
                    <strong>{selectedResultOrder.nama_pasien}</strong>
                  </div>
                  <div className="meta-item">
                    <span>NIK</span>
                    <strong>{selectedResultOrder.nik || '-'}</strong>
                  </div>
                  <div className="meta-item">
                    <span>Kategori</span>
                    <strong>{selectedResultOrder.nama_kategori || 'Tes'}</strong>
                  </div>
                  <div className="meta-item">
                    <span>Prioritas</span>
                    <strong>{selectedResultOrder.is_cito ? 'CITO' : 'Reguler'}</strong>
                  </div>
                </div>
              )}

              {selectedResultOrderId && resultParameters.length > 0 ? (
                <form onSubmit={handleResultSubmit}>
                  <div className="table-scroll">
                    <table className="data-table compact-table lab-result-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Nilai</th>
                          <th>Referensi</th>
                          <th>Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultParameters.map((parameter) => {
                          const value = resultValues[String(parameter.id)] || {}
                          const indicator = getResultIndicator(parameter, value)

                          return (
                            <tr key={parameter.id}>
                              <td>
                                <div className="param-name">
                                  <strong>{parameter.nama_parameter}</strong>
                                  <span className="param-range">{parameter.satuan || 'Satuan tidak tersedia'}</span>
                                </div>
                              </td>
                              <td>
                                <div className="result-input-wrap">
                                  <input
                                    className="inline-input"
                                    value={value.nilai_hasil || ''}
                                    onChange={(event) => handleResultFieldChange(parameter.id, 'nilai_hasil', event.target.value)}
                                    placeholder="Masukkan nilai"
                                  />
                                  <span className={`result-tag ${indicator}`}>
                                    {indicator === 'normal' ? 'Normal' : indicator === 'abnormal' ? 'Abnormal' : 'Belum diisi'}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className="param-range">{getParameterRange(parameter)}</span>
                              </td>
                              <td>
                                <input
                                  className="inline-input"
                                  value={value.catatan || ''}
                                  onChange={(event) => handleResultFieldChange(parameter.id, 'catatan', event.target.value)}
                                  placeholder="Opsional"
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {!isDemoUser && (
                    <div className="action-row" style={{ marginTop: '1rem' }}>
                      <button type="submit" className="action-button primary" disabled={savingResult}>
                        <span className="action-button__icon"><FiCheck /></span>
                        <span>{savingResult ? 'Menyimpan...' : 'Simpan Hasil'}</span>
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="error-box">Belum ada parameter untuk pemeriksaan ini atau semua pemeriksaan sudah selesai.</div>
              )}
            </section>
          )}
        </div>
      )}

      {patientModalOpen && (
        <div className="modal-overlay" onClick={closePatientModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Pasien</h3>
              <button type="button" className="mini-button" onClick={closePatientModal}>Tutup</button>
            </div>

            <form onSubmit={handlePatientSubmit} className="form-grid modal-form">
              <label className="field">
                <span>NIK</span>
                <input name="nik" value={patientForm.nik} onChange={handlePatientFormChange} />
              </label>

              <label className="field">
                <span>Nama Pasien</span>
                <input name="nama_pasien" value={patientForm.nama_pasien} onChange={handlePatientFormChange} />
              </label>

              <label className="field">
                <span>Tanggal Lahir</span>
                <input type="date" name="tanggal_lahir" value={patientForm.tanggal_lahir} onChange={handlePatientFormChange} />
              </label>

              <label className="field">
                <span>Jenis Kelamin</span>
                <select name="jenis_kelamin" value={patientForm.jenis_kelamin} onChange={handlePatientFormChange}>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </label>

              <label className="field" style={{ gridColumn: '1 / -1' }}>
                <span>Alamat</span>
                <input name="alamat" value={patientForm.alamat} onChange={handlePatientFormChange} />
              </label>

              <label className="field" style={{ gridColumn: '1 / -1' }}>
                <span>No HP</span>
                <input name="no_hp" value={patientForm.no_hp} onChange={handlePatientFormChange} />
              </label>

              <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="button" className="mini-button" onClick={closePatientModal}>Batal</button>
                <button type="submit" className="action-button primary">Simpan Pasien</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default AnalisPage
