import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, Save, Database, ToggleLeft, ToggleRight, Sliders, Clock } from 'lucide-react'
import { getAdminKey, setAdminKey, getAppSettings, updateAppSettings } from '../api'
import { useToast } from '../components/Toast'

export default function SettingsPage() {
  const [keyInput, setKeyInput] = useState(getAdminKey())
  const [showKey, setShowKey] = useState(false)
  const { toast } = useToast()

  const [settings, setSettings] = useState({
    bugReportingEnabled: true,
    helpRequestsEnabled: true,
    exerciseRequestsEnabled: true,
    aiSuggestionsEnabled: true,
    aiSuggestionScheduleCron: '0 9 * * 0',
  })
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    getAppSettings()
      .then(d => {
        if (d.settings) {
          setSettings({
            bugReportingEnabled: d.settings.bugReportingEnabled,
            helpRequestsEnabled: d.settings.helpRequestsEnabled,
            exerciseRequestsEnabled: d.settings.exerciseRequestsEnabled,
            aiSuggestionsEnabled: d.settings.aiSuggestionsEnabled ?? true,
            aiSuggestionScheduleCron: d.settings.aiSuggestionScheduleCron ?? '0 9 * * 0',
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSettings(false))
  }, [])

  const handleSaveKey = () => {
    setAdminKey(keyInput)
    toast('Admin key updated', 'success')
  }

  const handleToggle = async (field: keyof typeof settings) => {
    const updated = { ...settings, [field]: !settings[field] }
    setSettings(updated)
    try {
      await updateAppSettings(updated)
      toast('App settings updated successfully', 'success')
    } catch {
      toast('Failed to update app settings', 'error')
      setSettings(settings) // rollback
    }
  }

  const apiBase = window.location.origin.includes('5173')
    ? 'http://localhost:3000/api'
    : '/api'

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Settings</div>
          <div className="section-sub">Control panel configuration</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
        {/* App Feature Toggles */}
        <div className="card">
          <div className="row" style={{ gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sliders size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>App Feature Toggles</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enable/disable app support options dynamically</div>
            </div>
          </div>
          {loadingSettings ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading settings...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="row-between" style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Bug Reporting</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Allow users to submit bug tickets</div>
                </div>
                <button
                  onClick={() => handleToggle('bugReportingEnabled')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {settings.bugReportingEnabled ? (
                    <ToggleRight size={38} color="var(--success)" fill="var(--success)" />
                  ) : (
                    <ToggleLeft size={38} color="var(--text-muted)" fill="var(--surface-secondary)" />
                  )}
                </button>
              </div>

              <div className="row-between" style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Help Requests</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Allow users to request customer support/help</div>
                </div>
                <button
                  onClick={() => handleToggle('helpRequestsEnabled')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {settings.helpRequestsEnabled ? (
                    <ToggleRight size={38} color="var(--success)" fill="var(--success)" />
                  ) : (
                    <ToggleLeft size={38} color="var(--text-muted)" fill="var(--surface-secondary)" />
                  )}
                </button>
              </div>

              <div className="row-between" style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Request Exercise</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Allow users to request missing exercises in library</div>
                </div>
                <button
                  onClick={() => handleToggle('exerciseRequestsEnabled')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {settings.exerciseRequestsEnabled ? (
                    <ToggleRight size={38} color="var(--success)" fill="var(--success)" />
                  ) : (
                    <ToggleLeft size={38} color="var(--text-muted)" fill="var(--surface-secondary)" />
                  )}
                </button>
              </div>

              <div className="row-between" style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>AI Suggestions</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Enable AI-powered workout adjustment suggestions</div>
                </div>
                <button
                  onClick={() => handleToggle('aiSuggestionsEnabled')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {settings.aiSuggestionsEnabled ? (
                    <ToggleRight size={38} color="var(--success)" fill="var(--success)" />
                  ) : (
                    <ToggleLeft size={38} color="var(--text-muted)" fill="var(--surface-secondary)" />
                  )}
                </button>
              </div>

              <div style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Clock size={14} color="var(--text-muted)" />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>AI Suggestion Schedule</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Cron expression for weekly AI suggestion generation (default: Sunday 9am)
                </div>
                <input
                  type="text"
                  value={settings.aiSuggestionScheduleCron}
                  onChange={e => setSettings({ ...settings, aiSuggestionScheduleCron: e.target.value })}
                  onBlur={() => updateAppSettings(settings).then(() => toast('Schedule updated', 'success')).catch(() => toast('Failed to update', 'error'))}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: 'Courier New, monospace' }}
                  placeholder="0 9 * * 0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Admin Key */}
        <div className="card">
          <div className="row" style={{ gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Admin Key</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Used to authenticate with the admin API</div>
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 12 }}>
            <label className="input-label">Current Admin Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowKey(s => !s)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 13, color: 'var(--warning-text)' }}>
            ⚠️ Set <code style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: 3 }}>ADMIN_KEY</code> in your API <code>.env</code> to a strong secret in production.
          </div>
          <button className="btn btn-primary" onClick={handleSaveKey}>
            <Save size={14} /> Save Key
          </button>
        </div>

        {/* API Info */}
        <div className="card">
          <div className="row" style={{ gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={18} color="var(--success)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>API Connection</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Backend server information</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow label="API Base URL" value={apiBase} mono />
            <InfoRow label="Admin Endpoint" value={`${apiBase}/admin/*`} mono />
            <InfoRow label="Auth Method" value="x-admin-key header" />
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="row" style={{ gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              ⚡
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>About Ryze CPanel</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin control panel for Ryze fitness app</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="Built with" value="React + Vite + TypeScript" />
            <InfoRow label="Design System" value="Ryze Iron Dark Theme" />
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="row-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: mono ? 'Courier New, monospace' : undefined }}>
        {value}
      </span>
    </div>
  )
}
