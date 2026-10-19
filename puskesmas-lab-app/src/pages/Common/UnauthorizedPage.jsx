import { Link } from 'react-router-dom'

function UnauthorizedPage() {
  return (
    <div className="message-page">
      <div className="message-card">
        <h1>Hak Akses Ditolak</h1>
        <p>Anda tidak memiliki izin untuk membuka halaman ini.</p>
        <Link to="/" className="primary-link">Kembali ke Dashboard</Link>
      </div>
    </div>
  )
}

export { UnauthorizedPage }
export default UnauthorizedPage
