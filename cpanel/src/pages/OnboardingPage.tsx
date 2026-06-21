import { useEffect, useState } from 'react'
import { getOnboardingStats } from '../api'
import { PageLoader } from '../components/UI'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { ClipboardList, ShieldAlert, Award, Dumbbell, Compass } from 'lucide-react'

interface OnboardingStats {
  onboardedCount: number
  totalCount: number
  genderStats: { name: string; count: number }[]
  goalStats: { name: string; count: number }[]
  experienceStats: { name: string; count: number }[]
  equipmentStats: { name: string; count: number }[]
  daysStats: { days: number; count: number }[]
  averages: {
    currentWeight: number | null
    height: number | null
    sleepHours: number | null
  }
}

const COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', '#8B5CF6']

export default function OnboardingPage() {
  const [stats, setStats] = useState<OnboardingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOnboardingStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />
  if (!stats) return <div className="empty-state">Failed to load onboarding statistics</div>

  const pendingCount = stats.totalCount - stats.onboardedCount
  const completionRate = stats.totalCount > 0 ? Math.round((stats.onboardedCount / stats.totalCount) * 100) : 0

  const formatKey = (key: string) => {
    return key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  const goalData = stats.goalStats.map(item => ({
    name: formatKey(item.name),
    count: item.count
  }))

  const expData = stats.experienceStats.map(item => ({
    name: formatKey(item.name),
    count: item.count
  }))

  const equipData = stats.equipmentStats.map(item => ({
    name: formatKey(item.name),
    count: item.count
  }))

  const genderData = stats.genderStats.map(item => ({
    name: formatKey(item.name),
    count: item.count
  }))

  return (
    <div className="form-grid" style={{ gap: 24 }}>
      <div className="section-header">
        <div>
          <div className="section-title">Onboarding Analytics</div>
          <div className="section-sub">Overview of user registration, preferences and setup choices</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
            <ClipboardList size={20} color="var(--primary)" />
          </div>
          <div className="stat-value">{stats.onboardedCount.toLocaleString()}</div>
          <div className="stat-label">Onboarded Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}>
            <ShieldAlert size={20} color="var(--warning)" />
          </div>
          <div className="stat-value">{pendingCount.toLocaleString()}</div>
          <div className="stat-label">Pending Onboarding</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>
            <Award size={20} color="var(--success)" />
          </div>
          <div className="stat-value">{completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      <div className="page-grid-2">
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={18} color="var(--primary)" />
            Averages of Onboarded Users
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Average Weight</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.averages.currentWeight ? `${stats.averages.currentWeight.toFixed(1)} kg` : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Average Height</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.averages.height ? `${stats.averages.height.toFixed(1)} cm` : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Average Daily Sleep</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.averages.sleepHours ? `${stats.averages.sleepHours.toFixed(1)} hrs` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dumbbell size={18} color="var(--success)" />
            Recommended Split Rules
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 13 }}>FULL BODY (3x/week)</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>For Beginners available 1-3 days per week</div>
            </div>
            <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: 13 }}>PUSH PULL LEGS (PPL)</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>For Intermediate available 6 days per week</div>
            </div>
            <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, color: 'var(--warning)', fontSize: 13 }}>BRO SPLIT</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>For users available 5 or more days per week</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-grid-2">
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Fitness Goals</h3>
          {goalData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={goalData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {goalData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Experience Levels</h3>
          {expData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={expData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {expData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="page-grid-2">
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Equipment Access</h3>
          {equipData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={equipData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={20} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {equipData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Gender Distribution</h3>
          {genderData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {genderData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
