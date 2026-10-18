import { useLocation } from 'react-router-dom'
import AppShell from '../../components/Layout/AppShell'

const userRows = [
  { id: 1, username: 'admin2', nama: 'Admin Puskesmas', role: 'Admin' },
  { id: 2, username: 'analis1', nama: 'Siti Analis', role: 'Analis' },
  { id: 3, username: 'dokter1', nama: 'dr. Rahma', role: 'Dokter' },
]

const kategoriRows = [
  { id: 1, nama: 'Hematologi' },
  { id: 2, nama: 'Kimia Klinik' },
  { id: 3, nama: 'Urinalisis' },
]

const parameterRows = [
  { id: 1, nama: 'Hemoglobin', kategori: 'Hematologi', satuan: 'g/dL', pria: '13-17', wanita: '12-15' },
  { id: 2, nama: 'Gula Darah', kategori: 'Kimia Klinik', satuan: 'mg/dL', pria: '70-110', wanita: '70-110' },
  { id: 3, nama: 'Leukosit', kategori: 'Hematologi', satuan: '10^3/uL', pria: '4.5-11.0', wanita: '4.5-11.0' },
]

function AdminPage() {
  const location = useLocation()
  const isDashboard = location.pathname === '/admin'
  const isUsers = location.pathname === '/admin/users'
  const isKategori = location.pathname === '/admin/kategori'
  const isParameter = location.pathname === '/admin/parameter'

  return (
    <AppShell
      role="admin"
      title="Dashboard Admin"
      description="Kelola pengguna, kategori tes, dan parameter referensi laboratorium."
      accentClass="admin"
    >
      <div className="panel-stack">
        {(isDashboard || isUsers) && (
          <section className="panel">
            <div className="panel-header">
              <h3>Manajemen Pengguna</h3>
              <button className="action-button primary">Tambah User</button>
            </div>
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
                {userRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.username}</td>
                    <td>{row.nama}</td>
                    <td><span className={`badge role-${row.role.toLowerCase()}`}>{row.role}</span></td>
                    <td>
                      <button className="mini-button">Edit</button>
                      <button className="mini-button danger">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(isDashboard || isKategori || isParameter) && (
          <section className="panel-grid">
            {isDashboard || isKategori ? (
              <div className="panel">
                <div className="panel-header">
                  <h3>Kategori Tes</h3>
                  <button className="action-button primary">Tambah</button>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nama Kategori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kategoriRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.nama}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {isDashboard || isParameter ? (
              <div className="panel">
                <div className="panel-header">
                  <h3>Parameter Tes</h3>
                  <button className="action-button primary">Tambah</button>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Kategori</th>
                      <th>Pria</th>
                      <th>Wanita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameterRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.nama}</td>
                        <td>{row.kategori}</td>
                        <td>{row.pria}</td>
                        <td>{row.wanita}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </AppShell>
  )
}

export default AdminPage
