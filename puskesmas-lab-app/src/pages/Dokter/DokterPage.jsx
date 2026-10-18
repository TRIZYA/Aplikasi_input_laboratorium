import { useLocation } from 'react-router-dom'
import AppShell from '../../components/Layout/AppShell'

const antreanRows = [
  { id: 1, pasien: 'Dewi Lestari', tes: 'Hematologi', status: 'Menunggu Validasi', cito: true },
  { id: 2, pasien: 'Budi Santoso', tes: 'Kimia Klinik', status: 'Menunggu Validasi', cito: false },
  { id: 3, pasien: 'Dian Pertiwi', tes: 'Urinalisis', status: 'Revisi', cito: true },
]

const riwayatRows = [
  { tanggal: '12 Jun 2026', pasien: 'Dewi Lestari', hasil: 'Hematologi', catatan: 'Konsisten dengan hasil kontrol sebelumnya' },
  { tanggal: '09 Jun 2026', pasien: 'Budi Santoso', hasil: 'Kimia Klinik', catatan: 'Nilai gula meningkat setelah puasa' },
  { tanggal: '03 Jun 2026', pasien: 'Dian Pertiwi', hasil: 'Urinalisis', catatan: 'Normal, tidak ada kelainan' },
]

function DokterPage() {
  const location = useLocation()
  const isDashboard = location.pathname === '/dokter'
  const isValidasi = location.pathname === '/dokter/validasi'
  const isRiwayat = location.pathname === '/dokter/riwayat'

  return (
    <AppShell
      role="dokter"
      title="Dashboard Dokter"
      description="Tinjau hasil laboratorium, validasi pemeriksaan, dan buat catatan klinis."
      accentClass="dokter"
    >
      <div className="panel-stack">
        {(isDashboard || isValidasi) && (
          <section className="panel">
            <div className="panel-header">
              <h3>Antrean Validasi</h3>
              <span className="pill total">3 pemeriksaan</span>
            </div>
            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>Pasien</th>
                  <th>Jenis Tes</th>
                  <th>Status</th>
                  <th>Prioritas</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {antreanRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.pasien}</td>
                    <td>{row.tes}</td>
                    <td>{row.status}</td>
                    <td>{row.cito ? <span className="status-pill danger">CITO</span> : <span className="status-pill neutral">Reguler</span>}</td>
                    <td>
                      <button className="mini-button success">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(isDashboard || isValidasi) && (
          <section className="panel review-panel">
            <div className="panel-header">
              <h3>Tinjauan Hasil</h3>
            </div>

            <div className="review-card">
              <div className="patient-summary">
                <div>
                  <p className="label">Pasien</p>
                  <strong>Dewi Lestari</strong>
                </div>
                <div>
                  <p className="label">NIK</p>
                  <strong>3201010202030001</strong>
                </div>
                <div>
                  <p className="label">Umur</p>
                  <strong>32 Tahun</strong>
                </div>
              </div>

              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Nilai</th>
                    <th>Rentang Referensi</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Hemoglobin</td>
                    <td>11.2</td>
                    <td>12 - 15</td>
                    <td><span className="status-pill danger">Abnormal</span></td>
                  </tr>
                  <tr>
                    <td>Leukosit</td>
                    <td>8.4</td>
                    <td>4.5 - 11</td>
                    <td><span className="status-pill success">Normal</span></td>
                  </tr>
                </tbody>
              </table>

              <label className="field textarea-field">
                <span>Catatan Klinis</span>
                <textarea rows="4" defaultValue="Pasien menunjukkan tanda anemia ringan, perlu konfirmasi klinis lebih lanjut." />
              </label>

              <div className="action-row">
                <button className="action-button danger">Tolak / Revisi</button>
                <button className="action-button success">Validasi & Sahkan</button>
              </div>
            </div>
          </section>
        )}

        {(isDashboard || isRiwayat) && (
          <section className="panel">
            <div className="panel-header">
              <h3>Riwayat Pasien</h3>
              <input className="search-input" type="text" placeholder="Cari pasien..." />
            </div>
            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Pasien</th>
                  <th>Hasil</th>
                  <th>Catatan Dokter</th>
                </tr>
              </thead>
              <tbody>
                {riwayatRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.tanggal}</td>
                    <td>{row.pasien}</td>
                    <td>{row.hasil}</td>
                    <td>{row.catatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </AppShell>
  )
}

export default DokterPage
