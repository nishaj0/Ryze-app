import { useState } from 'react'
import { Bell, Send, Users, Megaphone } from 'lucide-react'
import { sendBroadcast } from '../api'
import { useToast } from '../components/Toast'

export default function NotificationsPage() {
  const [form, setForm] = useState({ title: '', body: '' })
  const [sending, setSending] = useState(false)
  const [lastSent, setLastSent] = useState<{ title: string; body: string; at: string } | null>(null)
  const { toast } = useToast()

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      toast('Title and message are required', 'error')
      return
    }
    setSending(true)
    try {
      const res = await sendBroadcast(form)
      toast(res.message || 'Broadcast sent!', 'success')
      setLastSent({ ...form, at: new Date().toLocaleString() })
      setForm({ title: '', body: '' })
    } catch {
      toast('Failed to send broadcast', 'error')
    } finally {
      setSending(false)
    }
  }

  const templates = [
    { title: '🔥 New Feature Alert!', body: 'We just launched something exciting. Check it out in the app!' },
    { title: '💪 Stay Consistent!', body: "It's been a while — your gains are waiting. Get back to training today!" },
    { title: '🏆 Weekly Challenge', body: 'Complete 4 workouts this week and set a new PR. You\'ve got this!' },
    { title: '📊 Check Your Progress', body: 'Take a look at your progress charts — you might be surprised how far you\'ve come.' },
  ]

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Notifications</div>
          <div className="section-sub">Send push notifications to all users</div>
        </div>
      </div>

      <div className="page-grid-2">
        {/* Broadcast Form */}
        <div className="card">
          <div className="row" style={{ gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone size={20} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Broadcast Message</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Send to all registered users</div>
            </div>
          </div>

          <form onSubmit={handleSend} className="form-grid">
            <div className="input-group">
              <label className="input-label">Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. New feature alert!"
                maxLength={80}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{form.title.length}/80</div>
            </div>
            <div className="input-group">
              <label className="input-label">Message *</label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={4}
                placeholder="Your notification message..."
                maxLength={256}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{form.body.length}/256</div>
            </div>

            {/* Preview */}
            {(form.title || form.body) && (
              <div style={{ background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preview</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>⚡</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{form.title || 'Title'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{form.body || 'Message body...'}</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning)' }}>
              <Users size={16} color="var(--warning)" />
              <span style={{ fontSize: 13, color: 'var(--warning-text)', fontWeight: 500 }}>
                This notification will be sent to ALL registered users
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={sending} style={{ justifyContent: 'center' }}>
              <Send size={16} />
              {sending ? 'Sending...' : 'Send Broadcast'}
            </button>
          </form>
        </div>

        {/* Templates + History */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Quick Templates</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.map((t, i) => (
                <button
                  key={i}
                  className="btn btn-secondary"
                  style={{ textAlign: 'left', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
                  onClick={() => setForm({ title: t.title, body: t.body })}
                >
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{t.body.slice(0, 60)}…</span>
                </button>
              ))}
            </div>
          </div>

          {lastSent && (
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Last Broadcast</div>
              <div style={{ background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', padding: 14, border: '1px solid var(--success)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Bell size={14} color="var(--success)" />
                  <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>Sent successfully</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{lastSent.at}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{lastSent.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{lastSent.body}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
