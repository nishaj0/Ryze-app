import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Key, Eye, EyeOff } from 'lucide-react'
import { setAdminKey } from '../api'
import { getDashboard } from '../api'
import { useToast } from '../components/Toast'

export default function LoginPage() {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    try {
      setAdminKey(key)
      await getDashboard()
      toast('Welcome back!', 'success')
      navigate('/')
    } catch {
      toast('Invalid admin key. Please try again.', 'error')
      setAdminKey('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Zap size={26} color="white" fill="white" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Ryze</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 1 }}>Admin Control Panel</div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="form-grid">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            Enter your admin key to access the control panel.
          </p>
          <div className="input-group">
            <label className="input-label">Admin Key</label>
            <div style={{ position: 'relative' }}>
              <Key size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type={show ? 'text' : 'password'}
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="ryze-admin-2024"
                style={{ paddingLeft: 32, paddingRight: 40 }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          Default key: <code style={{ background: 'var(--surface-secondary)', padding: '2px 6px', borderRadius: 4 }}>ryze-admin-2024</code>
        </p>
      </div>
    </div>
  )
}
