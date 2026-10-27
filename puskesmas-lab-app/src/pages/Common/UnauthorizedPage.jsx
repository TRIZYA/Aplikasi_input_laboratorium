import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'

function UnauthorizedPage() {
  return (
    <div className="message-page">
      <div className="message-card">
        <h1>Hak Akses Ditolak</h1>
        <p>Anda tidak memiliki izin untuk membuka halaman ini.</p>
        <Link to="/" className="primary-link">
          <span className="action-button__icon"><FiArrowLeft /></span>
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>
    </div>
  )
}

export { UnauthorizedPage }
export default UnauthorizedPage
