import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, MessageSquare, Clock } from 'lucide-react'
import { getSupportTickets, respondToSupportTicket } from '../api'
import { useToast } from '../components/Toast'
import { PageLoader, Pagination, Avatar } from '../components/UI'
import { format, parseISO } from 'date-fns'

interface Ticket {
  id: string
  type: string
  title: string
  description: string
  status: string
  adminResponse?: string
  createdAt: string
  user: {
    id: string
    name?: string
    email: string
  }
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [responseOpen, setResponseOpen] = useState(false)
  const [adminResponse, setAdminResponse] = useState('')
  const [ticketStatus, setTicketStatus] = useState('RESOLVED')
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    getSupportTickets({ page, limit: 15, type: typeFilter, status: statusFilter })
      .then(d => {
        setTickets(d.tickets)
        setTotal(d.total)
        setTotalPages(d.totalPages)
      })
      .catch(() => toast('Failed to load tickets', 'error'))
      .finally(() => setLoading(false))
  }, [page, typeFilter, statusFilter, toast])

  useEffect(() => { load() }, [load])

  const openRespond = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setAdminResponse(ticket.adminResponse || '')
    setTicketStatus(ticket.status === 'PENDING' ? 'IN_PROGRESS' : ticket.status)
    setResponseOpen(true)
  }

  const handleSaveResponse = async () => {
    if (!selectedTicket) return
    if (!adminResponse.trim()) {
      toast('Please write a response first', 'error')
      return
    }
    setSaving(true)
    try {
      await respondToSupportTicket(selectedTicket.id, {
        adminResponse,
        status: ticketStatus,
      })
      toast('Ticket updated successfully', 'success')
      setResponseOpen(false)
      load()
    } catch {
      toast('Failed to respond to ticket', 'error')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="badge badge-success">Resolved</span>
      case 'IN_PROGRESS':
        return <span className="badge badge-warning">In Progress</span>
      default:
        return <span className="badge badge-danger">Pending</span>
    }
  }

  const getTypeTag = (type: string) => {
    switch (type) {
      case 'BUG':
        return <span className="tag tag-danger" style={{ textTransform: 'capitalize' }}>Bug</span>
      case 'HELP':
        return <span className="tag tag-primary" style={{ textTransform: 'capitalize' }}>Help Request</span>
      case 'EXERCISE_REQUEST':
        return <span className="tag tag-success" style={{ textTransform: 'capitalize' }}>Exercise Request</span>
      default:
        return <span className="tag tag-secondary" style={{ textTransform: 'capitalize' }}>{type}</span>
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Support Tickets</div>
          <div className="section-sub">{total} total support requests</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ width: 150, padding: '6px 12px', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
          >
            <option value="">All Types</option>
            <option value="BUG">Bug</option>
            <option value="HELP">Help Request</option>
            <option value="EXERCISE_REQUEST">Exercise Request</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: 150, padding: '6px 12px', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={load}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <>
          <div className="table-wrap card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="row">
                        <Avatar name={t.user.name} size={30} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{t.user.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{getTypeTag(t.type)}</td>
                    <td style={{ fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {format(parseISO(t.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openRespond(t)}>
                        <MessageSquare size={13} /> Respond
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {tickets.length === 0 && (
              <div className="empty-state">
                <Clock size={32} />
                <h3>No support tickets</h3>
                <p>No support tickets match the current filters.</p>
              </div>
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} limit={15} onPage={setPage} />
        </>
      )}

      {/* Response Modal */}
      {responseOpen && selectedTicket && (
        <div className="modal-overlay" onClick={() => setResponseOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">Ticket Details</span>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setResponseOpen(false)}>✕</button>
            </div>
            
            <div className="form-grid" style={{ gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {getTypeTag(selectedTicket.type)}
                {getStatusBadge(selectedTicket.status)}
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {format(parseISO(selectedTicket.createdAt), 'MMM d, yyyy HH:mm')}
                </span>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>From User</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{selectedTicket.user.name || '—'} ({selectedTicket.user.email})</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Subject</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{selectedTicket.title}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Description</div>
                <div style={{ 
                  marginTop: 6, 
                  padding: 12, 
                  background: 'var(--surface-secondary)', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: 14, 
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTicket.description}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

              <div className="input-group">
                <label className="input-label">Ticket Status</label>
                <select value={ticketStatus} onChange={e => setTicketStatus(e.target.value)}>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Admin Response</label>
                <textarea
                  value={adminResponse}
                  onChange={e => setAdminResponse(e.target.value)}
                  placeholder="Provide details of the resolution or support response..."
                  rows={5}
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    padding: 10,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setResponseOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveResponse} disabled={saving}>
                {saving ? 'Saving...' : 'Send Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
