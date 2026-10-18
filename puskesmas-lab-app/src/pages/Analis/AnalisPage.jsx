import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppShell from '../../components/Layout/AppShell'

const pasienRows = [
  { id: 1, nama: 'Dewi Lestari', nik: '3201010202030001', umur: 32, jenisKelamin: 'Perempuan' },
  { id: 2, nama: 'Budi Santoso', nik: '3201010202030002', umur: 44, jenisKelamin: 'Laki-laki' },
  { id: 3, nama: 'Dian Pertiwi', nik: '3201010202030003', umur: 27, jenisKelamin: 'Perempuan' },
]

const orderRows = [
  { id: 1, pasien: 'Dewi Lestari', tes: 'Hematologi', status: 'Menunggu Hasil', cito: true },
  { id: 2, pasien: 'Budi Santoso', tes: 'Kimia Klinik', status: 'Siap Validasi', cito: false },
  { id: 3, pasien: 'Dian Pertiwi', tes: 'Urinalisis', status: 'Draf Hasil', cito: true },
]

const hasilRows = [
  { parameter: 'Hemoglobin', nilai: '11.2', satuan: 'g/dL', status: 'Abnormal' },
  { parameter: 'Leukosit', nilai: '8.4', satuan: '10^3/uL', status: 'Normal' },
  { parameter: 'Gula Darah', nilai: '128', satuan: 'mg/dL', status: 'Abnormal' },
]

function AnalisPage() {
  const location = useLocation()
  const isDashboard = location.pathname === '/analis'
  const isPasien = location.pathname === '/analis/pasien'
  const isOrder = location.pathname === '/analis/order'
  const isHasil = location.pathname === '/analis/hasil'

  const [form, setForm] = useState({
    pasien: 'Dewi Lestari',
    jenisTes: 'Hematologi',
    prioritas: false,
  })

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <AppShell
      role="analis"
      title="Dashboard Analis"
      description="Input pemeriksaan dan simpan hasil dengan auto-flagging yang terintegrasi."
      accentClass="analis"
    >
      <div className="panel-stack">
        {(isDashboard || isPasien) && (
          <section className="panel">
            <div className="panel-header">
              <h3>Manajemen Pasien</h3>
              <button className="action-button primary">Tambah Pasien</button>
            </div>
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
                {pasienRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.nama}</td>
                    <td>{row.nik}</td>
                    <td>{row.umur}</td>
                    <td>{row.jenisKelamin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(isDashboard || isOrder) && (
          <section className="panel">
            <div className="panel-header">
              <h3>Order Pemeriksaan</h3>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Pasien</span>
                <select name="pasien" value={form.pasien} onChange={handleFormChange}>
                  {pasienRows.map((item) => (
                    <option key={item.id} value={item.nama}>{item.nama}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Jenis Tes</span>
                <select name="jenisTes" value={form.jenisTes} onChange={handleFormChange}>
                  <option>Hematologi</option>
                  <option>Kimia Klinik</option>
                  <option>Urinalisis</option>
                </select>
              </label>

              <label className="checkbox-field">
                <input type="checkbox" name="prioritas" checked={form.prioritas} onChange={handleFormChange} />
                <span>Prioritas / CITO</span>
              </label>
            </div>

            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>Pasien</th>
                  <th>Jenis Tes</th>
                  <th>Status</th>
                  <th>CITO</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.pasien}</td>
                    <td>{row.tes}</td>
                    <td>{row.status}</td>
                    <td>{row.cito ? <span className="status-pill danger">CITO</span> : <span className="status-pill neutral">Biasa</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(isDashboard || isHasil) && (
          <section className="panel">
            <div className="panel-header">
              <h3>Input Hasil Lab</h3>
              <button className="action-button primary">Simpan Hasil</button>
            </div>

            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Nilai</th>
                  <th>Satuan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hasilRows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.parameter}</td>
                    <td><input className="inline-input" defaultValue={row.nilai} /></td>
                    <td>{row.satuan}</td>
                    <td>
                      {row.status === 'Abnormal' ? (
                        <span className="status-pill danger">Abnormal</span>
                      ) : (
                        <span className="status-pill success">Normal</span>
                      )}
                    </td>
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

export default AnalisPage
