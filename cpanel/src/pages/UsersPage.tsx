import { useEffect, useState, useCallback } from 'react'
import { Search, RefreshCw, Trash2, Edit2, RotateCcw } from 'lucide-react'
import { getUsers, deleteUser, updateUser, resetOnboarding } from '../api'
import { useToast } from '../components/Toast'
import { PageLoader, Pagination, Avatar, ConfirmDialog } from '../components/UI'
import { format, parseISO } from 'date-fns'

interface User {
  id: string; email: string; name?: string; gender?: string; goal?: string;
  experienceLevel?: string; onboardingDone: boolean; createdAt: string;
  _count: { workoutSessions: number; personalRecords: number }
}

interface EditForm { name: string; email: string; goal: string; gender: string; experienceLevel: string; onboardingDone: boolean }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({ name: '', email: '', goal: '', gender: '', experienceLevel: '', onboardingDone: false })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [resetConfirm, setResetConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    getUsers({ page, limit: 20, search })
      .then(d => { setUsers(d.users); setTotal(d.total); setTotalPages(d.totalPages) })
      .catch(() => toast('Failed to load users', 'error'))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const openEdit = (u: User) => {
    setSelectedUser(u)
    setEditForm({ name: u.name || '', email: u.email, goal: u.goal || '', gender: u.gender || '', experienceLevel: u.experienceLevel || '', onboardingDone: u.onboardingDone })
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      await updateUser(selectedUser.id, editForm)
      toast('User updated successfully', 'success')
      setEditOpen(false)
      load()
    } catch { toast('Failed to update user', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteUser(deleteConfirm)
      toast('User deleted', 'success')
      setDeleteConfirm(null)
      load()
    } catch { toast('Failed to delete user', 'error') }
  }

  const handleReset = async () => {
    if (!resetConfirm) return
    try {
      await resetOnboarding(resetConfirm)
      toast('Onboarding reset for user', 'success')
      setResetConfirm(null)
      load()
    } catch { toast('Failed to reset onboarding', 'error') }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Users</div>
          <div className="section-sub">{total.toLocaleString()} total users</div>
        </div>
        <div className="row">
          <form onSubmit={handleSearch} className="row" style={{ gap: 8 }}>
            <div className="search-wrap">
              <Search />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search name or email..."
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={load} title="Refresh">
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
                  <th>Goal</th>
                  <th>Experience</th>
                  <th>Onboarding</th>
                  <th>Sessions</th>
                  <th>PRs</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="row">
                        <Avatar name={u.name} size={32} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name || '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.goal ? <span className="tag tag-primary">{u.goal}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{u.experienceLevel || '—'}</td>
                    <td>
                      <span className={`badge ${u.onboardingDone ? 'badge-success' : 'badge-warning'}`}>
                        {u.onboardingDone ? '✓ Complete' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{u._count.workoutSessions}</td>
                    <td style={{ fontWeight: 600, color: 'var(--warning)' }}>{u._count.personalRecords}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(parseISO(u.createdAt), 'MMM d, yyyy')}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" title="Edit" onClick={() => openEdit(u)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-secondary btn-sm btn-icon" title="Reset Onboarding" onClick={() => setResetConfirm(u.id)}>
                          <RotateCcw size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => setDeleteConfirm(u.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="empty-state">
                <Search />
                <h3>No users found</h3>
                <p>Try a different search query</p>
              </div>
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPage={setPage} />
        </>
      )}

      {/* Edit Modal */}
      {editOpen && selectedUser && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Edit User</span>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditOpen(false)}>✕</button>
            </div>
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label className="input-label">Goal</label>
                  <select value={editForm.goal} onChange={e => setEditForm(f => ({ ...f, goal: e.target.value }))}>
                    <option value="">—</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="fat_loss">Fat Loss</option>
                    <option value="strength">Strength</option>
                    <option value="endurance">Endurance</option>
                    <option value="general_fitness">General Fitness</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Gender</label>
                  <select value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">—</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Experience Level</label>
                <select value={editForm.experienceLevel} onChange={e => setEditForm(f => ({ ...f, experienceLevel: e.target.value }))}>
                  <option value="">—</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="row">
                <input
                  type="checkbox"
                  id="onboarded"
                  style={{ width: 'auto', marginRight: 8 }}
                  checked={editForm.onboardingDone}
                  onChange={e => setEditForm(f => ({ ...f, onboardingDone: e.target.checked }))}
                />
                <label htmlFor="onboarded" className="input-label" style={{ margin: 0 }}>Onboarding Complete</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete User"
        message="This will permanently delete the user and all their data including sessions, records, and photos. This cannot be undone."
        confirmLabel="Delete User"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        danger
      />

      <ConfirmDialog
        open={!!resetConfirm}
        title="Reset Onboarding"
        message="This will reset the user's onboarding status and clear their profile data (goal, gender, experience level etc). They'll need to re-complete onboarding."
        confirmLabel="Reset Onboarding"
        onConfirm={handleReset}
        onCancel={() => setResetConfirm(null)}
      />
    </div>
  )
}
