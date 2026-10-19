import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppShell from '../../components/Layout/AppShell'
import { getStoredAuth } from '../../utils/auth'

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

function DokterPage() {
  const location = useLocation()
  const isDashboard = location.pathname === '/dokter'
  const isValidasi = location.pathname === '/dokter/validasi'
  const isRiwayat = location.pathname === '/dokter/riwayat'

  const auth = getStoredAuth()
  const token = auth?.token
  const currentUserId = auth?.user?.id
  const isDemoUser = auth?.user?.role === 'demo'

  const [pemeriksaanRows, setPemeriksaanRows] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [catatanDokter, setCatatanDokter] = useState('')

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

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'Permintaan gagal')
    }

    return data
  }

  const loadPemeriksaan = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const data = await fetchAuthJson('http://localhost:4000/api/pemeriksaan')
      const rows = Array.isArray(data) ? data : data.data || []
      setPemeriksaanRows(rows)

      if (!selectedId && rows.length > 0) {
        setSelectedId(rows[0].id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedId, token])

  const loadSelectedDetail = useCallback(async (pemeriksaanId) => {
    if (!pemeriksaanId || !token) return

    try {
      const data = await fetchAuthJson(`http://localhost:4000/api/pemeriksaan/${pemeriksaanId}`)
      setSelectedDetail(data)
      setCatatanDokter(data.catatan_dokter || '')
    } catch (err) {
      setError(err.message)
    }
  }, [token])

  useEffect(() => {
    void loadPemeriksaan()
  }, [loadPemeriksaan])

  useEffect(() => {
    if (selectedId) {
      void loadSelectedDetail(selectedId)
    }
  }, [loadSelectedDetail, selectedId])

  const handleValidasi = async (status) => {
    if (!selectedId || !currentUserId) {
      setError('Sesi dokter belum aktif.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await fetchAuthJson(`http://localhost:4000/api/pemeriksaan/${selectedId}/validasi`, {
        method: 'POST',
        body: JSON.stringify({
          validator_id: Number(currentUserId),
          status,
          catatan_dokter: catatanDokter.trim() || null,
        }),
      })

      setSuccessMessage(status === 'selesai' ? 'Hasil berhasil divalidasi.' : 'Pemeriksaan dikembalikan untuk revisi.')
      await loadPemeriksaan()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const pageTitle = isDashboard ? 'Dashboard Dokter' : isValidasi ? 'Antrean Validasi' : 'Riwayat Pasien'

  const pendingRows = pemeriksaanRows.filter((row) => row.status === 'menunggu_validasi' || row.status === 'revisi')
  const selectedPatient = selectedDetail ? {
    nama_pasien: selectedDetail.nama_pasien,
    nik: selectedDetail.nik,
    tanggal_lahir: selectedDetail.tanggal_lahir,
    jenis_kelamin: selectedDetail.jenis_kelamin,
  } : null

  return (
    <AppShell
      role="dokter"
      title={pageTitle}
      description="Tinjau hasil laboratorium, validasi pemeriksaan, dan buat catatan klinis."
      accentClass="dokter"
    >
      {isDemoUser && (
        <div className="error-box" style={{ marginBottom: '1rem' }}>
          Akun demo hanya dapat melihat hasil dan riwayat. Validasi, revisi, dan persetujuan klinis tidak tersedia untuk role ini.
        </div>
      )}

      {isDashboard ? (
        <div className="panel-stack dashboard-summary">
          <section className="panel">
            <div className="panel-header">
              <h3>Ringkasan Dokter</h3>
            </div>
            <div className="summary-grid">
              <div className="summary-card dokter">
                <span>Antrean Validasi</span>
                <strong>{pendingRows.length}</strong>
              </div>
              <div className="summary-card dokter">
                <span>Pasien Direview</span>
                <strong>{pemeriksaanRows.filter((row) => row.status === 'selesai').length}</strong>
              </div>
              <div className="summary-card dokter">
                <span>Riwayat</span>
                <strong>{pemeriksaanRows.length}</strong>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="panel-stack">
          {isValidasi && (
            <>
              <section className="panel">
                <div className="panel-header">
                  <h3>Antrean Validasi</h3>
                  <span className="pill total">{pendingRows.length} pemeriksaan</span>
                </div>

                {error && <div className="error-box">{error}</div>}
                {successMessage && <div className="success-box">{successMessage}</div>}

                <div className="table-scroll">
                  <table className="data-table compact-table">
                    <thead>
                      <tr>
                        <th>Pasien</th>
                        <th>Status</th>
                        <th>Prioritas</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="4">Memuat antrean...</td></tr>
                      ) : pendingRows.length > 0 ? (
                        pendingRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.nama_pasien}</td>
                            <td>{statusLabel[row.status] || row.status}</td>
                            <td>{row.is_cito ? <span className="status-pill danger">CITO</span> : <span className="status-pill neutral">Reguler</span>}</td>
                            <td>
                              <button type="button" className="mini-button success" onClick={() => setSelectedId(row.id)}>Review</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4">Belum ada pemeriksaan menunggu validasi.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="panel review-panel">
                <div className="panel-header">
                  <h3>Tinjauan Hasil</h3>
                </div>

                {!selectedDetail ? (
                  <div className="error-box">Pilih pemeriksaan untuk meninjau hasil.</div>
                ) : (
                  <div className="review-card">
                    <div className="patient-summary">
                      <div>
                        <p className="label">Pasien</p>
                        <strong>{selectedPatient?.nama_pasien}</strong>
                      </div>
                      <div>
                        <p className="label">NIK</p>
                        <strong>{selectedPatient?.nik}</strong>
                      </div>
                      <div>
                        <p className="label">Umur</p>
                        <strong>{formatAge(selectedPatient?.tanggal_lahir)}</strong>
                      </div>
                    </div>

                    <div className="table-scroll">
                      <table className="data-table compact-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Nilai</th>
                            <th>Referensi</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDetail.detail_hasil?.length ? (
                            selectedDetail.detail_hasil.map((item) => (
                              <tr key={item.id}>
                                <td>{item.nama_parameter}</td>
                                <td>{item.nilai_hasil}</td>
                                <td>{item.nilai_rujukan || '-'}</td>
                                <td>
                                  {item.is_abnormal ? (
                                    <span className="status-pill danger">Abnormal</span>
                                  ) : (
                                    <span className="status-pill success">Normal</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="4">Belum ada hasil untuk pemeriksaan ini.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <label className="field textarea-field">
                      <span>Catatan Klinis</span>
                      <textarea
                        rows="4"
                        value={catatanDokter}
                        onChange={(event) => setCatatanDokter(event.target.value)}
                        placeholder="Masukkan catatan klinis atau alasan revisi..."
                      />
                    </label>

                    {!isDemoUser && (
                      <div className="action-row">
                        <button type="button" className="action-button danger" onClick={() => handleValidasi('revisi')} disabled={submitting}>
                          {submitting ? 'Memproses...' : 'Tolak / Revisi'}
                        </button>
                        <button type="button" className="action-button success" onClick={() => handleValidasi('selesai')} disabled={submitting}>
                          {submitting ? 'Memproses...' : 'Validasi & Sahkan'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {isRiwayat && (
            <section className="panel">
              <div className="panel-header">
                <h3>Riwayat Pasien</h3>
                <input className="search-input" type="text" placeholder="Cari pasien..." />
              </div>
              <div className="table-scroll">
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>Pasien</th>
                      <th>Status</th>
                      <th>Prioritas</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pemeriksaanRows.length > 0 ? (
                      pemeriksaanRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.nama_pasien}</td>
                          <td>{statusLabel[row.status] || row.status}</td>
                          <td>{row.is_cito ? <span className="status-pill danger">CITO</span> : <span className="status-pill neutral">Reguler</span>}</td>
                          <td>{row.catatan_dokter || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4">Belum ada riwayat pemeriksaan.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  )
}

export default DokterPage
