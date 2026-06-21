

interface ConfirmProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger }: ConfirmProps) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPage: (p: number) => void
}

export function Pagination({ page, totalPages, total, limit, onPage }: PaginationProps) {
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  return (
    <div className="pagination">
      <span>Showing {start}–{end} of {total}</span>
      <div className="pagination-buttons">
        <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
        <span style={{ padding: '5px 10px', fontSize: 13, color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
        <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  )
}

export function Spinner() {
  return <div className="loading-spinner" />
}

export function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--text-muted)' }}>
      <Spinner /> Loading...
    </div>
  )
}

interface AvatarProps { name?: string | null; size?: number }
export function Avatar({ name, size = 34 }: AvatarProps) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2) : '?'
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

interface BadgeProps {
  children: React.ReactNode
  color?: string
}

const badgeColors: Record<string, { bg: string; text: string }> = {
  success: { bg: '#d1fae5', text: '#065f46' },
  warning: { bg: '#fef3c7', text: '#92400e' },
  danger: { bg: '#fee2e2', text: '#991b1b' },
  info: { bg: '#dbeafe', text: '#1e40af' },
  default: { bg: '#f3f4f6', text: '#374151' },
}

export function Badge({ children, color = 'default' }: BadgeProps) {
  const c = badgeColors[color] || badgeColors.default
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: c.bg,
      color: c.text,
      textTransform: 'capitalize',
    }}>
      {children}
    </span>
  )
}
