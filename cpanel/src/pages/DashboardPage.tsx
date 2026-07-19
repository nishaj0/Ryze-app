import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Layers, Dumbbell, Activity, TrendingUp,
  UserCheck, ChevronRight, Calendar
} from 'lucide-react'
import { getDashboard, getSuggestionAcceptanceAnalytics } from '../api'
import { PageLoader, Avatar } from '../components/UI'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface DashData {
  stats: {
    totalUsers: number
    onboardedUsers: number
    totalSessions: number
    totalSplits: number
    totalExercises: number
    activeSplitCount: number
  }
  recentUsers: any[]
  dailySessions: { date: string; count: number }[]
}

interface SuggestionAnalytics {
  acceptedCount: number
  dismissedCount: number
  resolvedCount: number
  acceptanceRate: number | null
  breakdown: { suggestionType: string; acceptedCount: number; dismissedCount: number; resolvedCount: number; acceptanceRate: number | null }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="card card-sm" style={{ minWidth: 120 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>{payload[0].value} sessions</div>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null)
  const [suggestionAnalytics, setSuggestionAnalytics] = useState<SuggestionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(setData).catch(console.error).finally(() => setLoading(false))
    getSuggestionAcceptanceAnalytics().then(setSuggestionAnalytics).catch(console.error)
  }, [])

  if (loading) return <PageLoader />
  if (!data) return <div className="empty-state">Failed to load dashboard</div>

  const { stats, recentUsers, dailySessions } = data

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'var(--primary)', bg: 'var(--primary-light)' },
    { icon: UserCheck, label: 'Onboarded', value: stats.onboardedUsers, color: 'var(--success)', bg: 'var(--success-bg)' },
    { icon: Activity, label: 'Workouts Done', value: stats.totalSessions, color: 'var(--warning)', bg: 'var(--warning-bg)' },
    { icon: Layers, label: 'Splits', value: stats.totalSplits, color: 'var(--primary)', bg: 'var(--primary-light)' },
    { icon: Dumbbell, label: 'Exercises', value: stats.totalExercises, color: 'var(--success)', bg: 'var(--success-bg)' },
    { icon: TrendingUp, label: 'Active Plans', value: stats.activeSplitCount, color: 'var(--warning)', bg: 'var(--warning-bg)' },
  ]

  const chartData = dailySessions.map(d => ({
    date: format(parseISO(d.date as string), 'MMM d'),
    sessions: d.count,
  }))

  const onboardingRate = stats.totalUsers > 0
    ? Math.round((stats.onboardedUsers / stats.totalUsers) * 100)
    : 0

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div className="stat-value">{s.value.toLocaleString()}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>AI Suggestion Acceptance</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Resolved suggestions only; read-only product signal</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{suggestionAnalytics?.acceptanceRate == null ? '—' : `${Math.round(suggestionAnalytics.acceptanceRate * 100)}%`}</div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
          <span><strong>{suggestionAnalytics?.acceptedCount ?? 0}</strong> accepted</span>
          <span><strong>{suggestionAnalytics?.dismissedCount ?? 0}</strong> dismissed</span>
          {suggestionAnalytics?.breakdown.map((item) => <span key={item.suggestionType}><strong>{item.suggestionType.replace('_', ' ')}</strong>: {item.acceptanceRate == null ? '—' : `${Math.round(item.acceptanceRate * 100)}%`}</span>)}
        </div>
      </div>

      {/* Chart + Recent Users */}
      <div className="page-grid-2">
        {/* Activity Chart */}
        <div className="chart-container">
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Workout Activity</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Completed sessions — last 30 days</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
              <Calendar size={14} /> 30 days
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Onboarding Funnel */}
        <div className="chart-container">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Onboarding Funnel</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>User conversion overview</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FunnelBar label="Registered" value={stats.totalUsers} max={stats.totalUsers} color="var(--primary)" />
            <FunnelBar label="Onboarding Complete" value={stats.onboardedUsers} max={stats.totalUsers} color="var(--success)" />
            <FunnelBar label="Active Plan" value={stats.activeSplitCount} max={stats.totalUsers} color="var(--warning)" />
            <FunnelBar label="Trained at least once" value={Math.min(stats.totalSessions, stats.totalUsers)} max={stats.totalUsers} color="var(--primary)" />
          </div>

          <div style={{ marginTop: 20, padding: '16px', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{onboardingRate}%</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Onboarding Rate</div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Recent Signups</div>
          <Link to="/users" className="btn btn-secondary btn-sm">
            View All <ChevronRight size={13} />
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Onboarded</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <div className="row">
                      <Avatar name={u.name} size={30} />
                      <span style={{ fontWeight: 600 }}>{u.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.onboardingDone ? 'badge-success' : 'badge-warning'}`}>
                      {u.onboardingDone ? '✓ Done' : '⏳ Pending'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {format(parseISO(u.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="row-between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 8, background: 'var(--surface-tertiary)', borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}
