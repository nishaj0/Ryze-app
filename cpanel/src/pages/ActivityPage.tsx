import { useEffect, useState, useCallback } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { getSessions } from '../api'
import { PageLoader, Pagination, Avatar } from '../components/UI'
import { format, parseISO } from 'date-fns'

interface Session {
  id: string; date: string; status: string; durationMinutes?: number;
  user: { id: string; name?: string; email: string }
  splitDay: { name: string }
  _count: { exerciseLogs: number }
}

const statusBadge = (s: string) => {
  if (s === 'COMPLETED') return 'badge-success'
  if (s === 'IN_PROGRESS') return 'badge-warning'
  return 'badge-muted'
}

export default function ActivityPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    getSessions({ page, limit: 25 })
      .then((d: any) => { setSessions(d.sessions); setTotal(d.total); setTotalPages(d.totalPages) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Live Activity</div>
          <div className="section-sub">{total.toLocaleString()} total workout sessions</div>
        </div>
        <button className="btn btn-secondary btn-sm btn-icon" onClick={load}><RefreshCw size={14} /></button>
      </div>

      {loading ? <PageLoader /> : (
        <>
          <div className="table-wrap card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Day / Split</th>
                  <th>Status</th>
                  <th>Exercises</th>
                  <th>Duration</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="row">
                        <Avatar name={s.user.name} size={30} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.user.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{s.splitDay.name}</td>
                    <td><span className={`badge ${statusBadge(s.status)}`}>{s.status.replace('_', ' ')}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{s._count.exerciseLogs}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {s.durationMinutes ? `${s.durationMinutes} min` : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {format(parseISO(s.date as string), 'MMM d, yyyy · HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length === 0 && (
              <div className="empty-state"><Activity /><h3>No sessions yet</h3></div>
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={25} onPage={setPage} />
        </>
      )}
    </div>
  )
}
