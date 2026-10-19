import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STORAGE_KEY, getRoleLandingPath } from '../../utils/auth'

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: 'admin2', password: 'admin123' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        username: String(form.username).trim(),
        password: String(form.password).trim(),
      }

      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal')
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: data.token,
          user: data.user,
        })
      )

      const landingPath = getRoleLandingPath(data.user?.role || 'admin')
      navigate(landingPath, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="eyebrow">Sistem Laboratorium</span>
          <h1>Puskesmas Lab</h1>
          <p>Masuk untuk mengakses dashboard sesuai role Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Username
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Masukkan username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Masukkan password"
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo akun:</p>
          <ul>
            <li>admin2 / admin123</li>
            <li>analis1 / analis123</li>
            <li>dokter1 / dokter123</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
