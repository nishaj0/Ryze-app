import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, Star, StarOff, ChevronUp, ChevronDown, X, Eye, SlidersHorizontal } from 'lucide-react'
import { getSplits, deleteSplit, togglePrebuilt, createSplit, getExercises, getExerciseFilters } from '../api'
import { useToast } from '../components/Toast'
import { PageLoader, Pagination, ConfirmDialog } from '../components/UI'
import ExercisePreviewModal from '../components/ExercisePreviewModal'
import { format, parseISO } from 'date-fns'

interface Split {
  id: string; name: string; type: string; daysPerWeek: number; isPrebuilt: boolean;
  description?: string; createdAt: string; createdBy?: { name?: string; email: string };
  _count: { days: number; userSplits: number }
}

interface DayForm {
  name: string; isRest: boolean; muscleGroups: string[];
  exercises: { exerciseId: string; name: string; targetSets: number; targetRepsMin: number; targetRepsMax: number }[]
}

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'abs', 'calves', 'full body']

export default function SplitsPage() {
  const [splits, setSplits] = useState<Split[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<'all' | 'prebuilt' | 'draft'>('all')
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const { toast } = useToast()

  // Create form state
  const [form, setForm] = useState({ name: '', description: '', type: 'push_pull_legs', daysPerWeek: 3 })
  const [days, setDays] = useState<DayForm[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [exSearch, setExSearch] = useState('')
  const [exPage, setExPage] = useState(1)
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [previewExId, setPreviewExId] = useState<string | null>(null)
  const [exFilters, setExFilters] = useState({ muscle: '', level: '', equipment: '', category: '', mechanic: '', force: '' })
  const [filterOptions, setFilterOptions] = useState<{ muscles: string[]; equipment: string[]; categories: string[]; levels: string[]; mechanics: string[]; forces: string[] }>({ muscles: [], equipment: [], categories: [], levels: [], mechanics: [], forces: [] })
  const [showExFilters, setShowExFilters] = useState(false)

  const loadSplits = useCallback(() => {
    setLoading(true)
    const params: any = { page, limit: 20 }
    if (filter === 'prebuilt') params.isPrebuilt = 'true'
    if (filter === 'draft') params.isPrebuilt = 'false'
    getSplits(params)
      .then(d => { setSplits(d.splits); setTotal(d.total); setTotalPages(d.totalPages) })
      .catch(() => toast('Failed to load splits', 'error'))
      .finally(() => setLoading(false))
  }, [page, filter])

  useEffect(() => { loadSplits() }, [loadSplits])

  const loadExercises = useCallback(() => {
    const params: Record<string, any> = { page: exPage, limit: 20, search: exSearch }
    if (exFilters.muscle) params.muscle = exFilters.muscle
    if (exFilters.level) params.level = exFilters.level
    if (exFilters.equipment) params.equipment = exFilters.equipment
    if (exFilters.category) params.category = exFilters.category
    if (exFilters.mechanic) params.mechanic = exFilters.mechanic
    if (exFilters.force) params.force = exFilters.force
    getExercises(params)
      .then((d: any) => { setExercises(d.exercises) })
      .catch(console.error)
  }, [exPage, exSearch, exFilters])

  useEffect(() => { if (createOpen) loadExercises() }, [createOpen, loadExercises])

  useEffect(() => {
    if (createOpen) {
      getExerciseFilters()
        .then((d: any) => setFilterOptions(d))
        .catch(console.error)
    }
  }, [createOpen])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try { await deleteSplit(deleteConfirm); toast('Split deleted', 'success'); setDeleteConfirm(null); loadSplits() }
    catch { toast('Failed to delete split', 'error') }
  }

  const handleToggle = async (id: string) => {
    try { await togglePrebuilt(id); toast('Updated', 'success'); loadSplits() }
    catch { toast('Failed to update split', 'error') }
  }

  // Init days when daysPerWeek changes
  useEffect(() => {
    setDays(Array.from({ length: form.daysPerWeek }, (_, i) => ({
      name: `Day ${i + 1}`,
      isRest: false,
      muscleGroups: [],
      exercises: [],
    })))
  }, [form.daysPerWeek])

  const addExerciseToDay = (ex: any) => {
    if (activeDayIdx === null) return
    setDays(prev => prev.map((d, i) => i === activeDayIdx ? {
      ...d,
      exercises: [...d.exercises, { exerciseId: ex.id, name: ex.name, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 }]
    } : d))
  }

  const removeExFromDay = (dayIdx: number, exIdx: number) => {
    setDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d))
  }

  const toggleMuscle = (dayIdx: number, muscle: string) => {
    setDays(prev => prev.map((d, i) => i === dayIdx ? {
      ...d,
      muscleGroups: d.muscleGroups.includes(muscle) ? d.muscleGroups.filter(m => m !== muscle) : [...d.muscleGroups, muscle]
    } : d))
  }

  const handleCreate = async (isPrebuilt: boolean) => {
    if (!form.name.trim()) { toast('Split name is required', 'error'); return }
    setCreating(true)
    try {
      await createSplit({ ...form, days, isPrebuilt })
      toast(isPrebuilt ? 'Split published!' : 'Draft saved!', 'success')
      setCreateOpen(false)
      setForm({ name: '', description: '', type: 'push_pull_legs', daysPerWeek: 3 })
      setDays([])
      loadSplits()
    } catch { toast('Failed to create split', 'error') }
    finally { setCreating(false) }
  }

  const clearExFilters = () => {
    setExFilters({ muscle: '', level: '', equipment: '', category: '', mechanic: '', force: '' })
    setExPage(1)
  }

  const activeFilterCount = [exFilters.muscle, exFilters.level, exFilters.equipment, exFilters.category, exFilters.mechanic, exFilters.force].filter(Boolean).length

  const updateExFilter = (key: string, value: string) => {
    setExFilters(f => ({ ...f, [key]: value }))
    setExPage(1)
  }

  const clearSingleFilter = (key: string) => {
    setExFilters(f => ({ ...f, [key]: '' }))
    setExPage(1)
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Splits</div>
          <div className="section-sub">{total.toLocaleString()} total splits</div>
        </div>
        <div className="row">
          <div className="row" style={{ gap: 4 }}>
            {(['all', 'prebuilt', 'draft'] as const).map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setFilter(f); setPage(1) }}
                style={{ textTransform: 'capitalize' }}
              >
                {f === 'all' ? 'All' : f === 'prebuilt' ? '⭐ Prebuilt' : '📝 Draft'}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={loadSplits}><RefreshCw size={14} /></button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> New Split
          </button>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <>
          <div className="table-wrap card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {splits.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.description.slice(0, 50)}{s.description.length > 50 ? '…' : ''}</div>}
                    </td>
                    <td><span className="tag">{s.type.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{s._count.days} days</td>
                    <td>
                      <span className={`badge ${s.isPrebuilt ? 'badge-warning' : 'badge-muted'}`}>
                        {s.isPrebuilt ? '⭐ Prebuilt' : '📝 Draft'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s._count.userSplits}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {s.createdBy ? s.createdBy.name || s.createdBy.email : 'Admin'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {format(parseISO(s.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button
                          className={`btn btn-sm btn-icon ${s.isPrebuilt ? 'btn-warning' : 'btn-secondary'}`}
                          title={s.isPrebuilt ? 'Remove Prebuilt' : 'Mark Prebuilt'}
                          onClick={() => handleToggle(s.id)}
                          style={s.isPrebuilt ? { background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)' } : {}}
                        >
                          {s.isPrebuilt ? <StarOff size={13} /> : <Star size={13} />}
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteConfirm(s.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {splits.length === 0 && (
              <div className="empty-state"><Trash2 /><h3>No splits found</h3></div>
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPage={setPage} />
        </>
      )}

      {/* Create Split Modal */}
      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create Prebuilt Split</span>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setCreateOpen(false)}>✕</button>
            </div>

            {/* Basic Info */}
            <div className="form-grid form-grid-2" style={{ marginBottom: 20 }}>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Split Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. PPL 6-Day Powerbuilding" />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the split..." />
              </div>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="push_pull_legs">Push/Pull/Legs</option>
                  <option value="upper_lower">Upper/Lower</option>
                  <option value="bro_split">Bro Split</option>
                  <option value="full_body">Full Body</option>
                  <option value="arnold">Arnold Split</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Days Per Week</label>
                <select value={form.daysPerWeek} onChange={e => setForm(f => ({ ...f, daysPerWeek: parseInt(e.target.value) }))}>
                  {[2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days</option>)}
                </select>
              </div>
            </div>

            {/* Days */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Configure Days</div>
              {days.map((day, i) => (
                <div key={i} className="split-day-card">
                  <div className="row-between" style={{ marginBottom: 10 }}>
                    <div className="row" style={{ gap: 10 }}>
                      <input
                        value={day.name}
                        onChange={e => setDays(prev => prev.map((d, j) => j === i ? { ...d, name: e.target.value } : d))}
                        style={{ width: 160, padding: '5px 8px', fontSize: 13, fontWeight: 600 }}
                      />
                      <label className="row" style={{ gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={{ width: 'auto' }}
                          checked={day.isRest}
                          onChange={e => setDays(prev => prev.map((d, j) => j === i ? { ...d, isRest: e.target.checked } : d))}
                        />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Rest Day</span>
                      </label>
                    </div>
                    <button
                      className={`btn btn-sm ${activeDayIdx === i ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setActiveDayIdx(activeDayIdx === i ? null : i)}
                    >
                      {activeDayIdx === i ? <><ChevronUp size={13} /> Collapse</> : <><Plus size={13} /> Add Exercises</>}
                    </button>
                  </div>

                  {!day.isRest && (
                    <div className="tag-wrap" style={{ marginBottom: 8 }}>
                      {MUSCLE_GROUPS.map(m => (
                        <button
                          key={m}
                          className={`tag ${day.muscleGroups.includes(m) ? 'tag-primary' : ''}`}
                          style={{ cursor: 'pointer', border: 'none', fontFamily: 'Inter' }}
                          onClick={() => toggleMuscle(i, m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}

                  {day.exercises.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {day.exercises.map((ex, j) => (
                        <div key={j} className="exercise-row">
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{ex.name}</div>
                          <div className="row" style={{ gap: 6 }}>
                            <input type="number" value={ex.targetSets} min={1} max={10}
                              onChange={e => setDays(prev => prev.map((d, di) => di === i ? {
                                ...d, exercises: d.exercises.map((e2, ei) => ei === j ? { ...e2, targetSets: parseInt(e.target.value) } : e2)
                              } : d))}
                              style={{ width: 52, padding: '3px 6px', fontSize: 12 }} placeholder="Sets"
                            />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>sets</span>
                            <input type="number" value={ex.targetRepsMin} min={1}
                              onChange={e => setDays(prev => prev.map((d, di) => di === i ? {
                                ...d, exercises: d.exercises.map((e2, ei) => ei === j ? { ...e2, targetRepsMin: parseInt(e.target.value) } : e2)
                              } : d))}
                              style={{ width: 48, padding: '3px 6px', fontSize: 12 }}
                            />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>–</span>
                            <input type="number" value={ex.targetRepsMax} min={1}
                              onChange={e => setDays(prev => prev.map((d, di) => di === i ? {
                                ...d, exercises: d.exercises.map((e2, ei) => ei === j ? { ...e2, targetRepsMax: parseInt(e.target.value) } : e2)
                              } : d))}
                              style={{ width: 48, padding: '3px 6px', fontSize: 12 }}
                            />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>reps</span>
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeExFromDay(i, j)}>
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeDayIdx === i && (
                    <div style={{ marginTop: 12, padding: 12, background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      {/* Search + Filters toggle */}
                      <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                        <div className="search-wrap" style={{ flex: 1, maxWidth: '100%' }}>
                          <Search size={14} />
                          <input value={exSearch} onChange={e => { setExSearch(e.target.value); setExPage(1) }} placeholder="Search exercises..." />
                        </div>
                        <button
                          className={`btn btn-sm ${showExFilters || activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setShowExFilters(s => !s)}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <SlidersHorizontal size={13} />
                          Filters
                          {activeFilterCount > 0 && (
                            <span style={{
                              background: showExFilters ? 'white' : 'var(--primary)',
                              color: showExFilters ? 'var(--primary)' : 'white',
                              borderRadius: 10, padding: '0 6px', fontSize: 10,
                              minWidth: 18, height: 18, display: 'inline-flex',
                              alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                            }}>{activeFilterCount}</span>
                          )}
                          {showExFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>

                      {/* Collapsible filter panel */}
                      {showExFilters && (
                        <div style={{
                          marginBottom: 10, padding: 12,
                          background: 'var(--surface-secondary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            <div className="input-group">
                              <label className="input-label">Muscle</label>
                              <select value={exFilters.muscle} onChange={e => updateExFilter('muscle', e.target.value)}>
                                <option value="">All muscles</option>
                                {filterOptions.muscles.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                            <div className="input-group">
                              <label className="input-label">Level</label>
                              <select value={exFilters.level} onChange={e => updateExFilter('level', e.target.value)}>
                                <option value="">All levels</option>
                                {filterOptions.levels.map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </div>
                            <div className="input-group">
                              <label className="input-label">Equipment</label>
                              <select value={exFilters.equipment} onChange={e => updateExFilter('equipment', e.target.value)}>
                                <option value="">All equipment</option>
                                {filterOptions.equipment.map(e => <option key={e} value={e}>{e}</option>)}
                              </select>
                            </div>
                            <div className="input-group">
                              <label className="input-label">Category</label>
                              <select value={exFilters.category} onChange={e => updateExFilter('category', e.target.value)}>
                                <option value="">All categories</option>
                                {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div className="input-group">
                              <label className="input-label">Mechanic</label>
                              <select value={exFilters.mechanic} onChange={e => updateExFilter('mechanic', e.target.value)}>
                                <option value="">All mechanics</option>
                                {filterOptions.mechanics.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                            <div className="input-group">
                              <label className="input-label">Force</label>
                              <select value={exFilters.force} onChange={e => updateExFilter('force', e.target.value)}>
                                <option value="">All force types</option>
                                {filterOptions.forces.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                            </div>
                          </div>
                          {activeFilterCount > 0 && (
                            <button className="btn btn-sm btn-secondary" onClick={clearExFilters} style={{ marginTop: 10, fontSize: 12 }}>
                              <X size={12} /> Clear all filters
                            </button>
                          )}
                        </div>
                      )}

                      {/* Active filter chips */}
                      {activeFilterCount > 0 && !showExFilters && (
                        <div className="tag-wrap" style={{ marginBottom: 10 }}>
                          {(['muscle', 'level', 'equipment', 'category', 'mechanic', 'force'] as const).map(k => {
                            const v = exFilters[k]
                            if (!v) return null
                            return (
                              <span key={k} className="tag tag-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                                {v}
                                <button
                                  onClick={() => clearSingleFilter(k)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', color: 'var(--primary)', lineHeight: 1 }}
                                  title="Remove filter"
                                >
                                  <X size={11} />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {/* Exercise results */}
                      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {exercises.map((ex: any) => (
                          <div key={ex.id}
                            className="exercise-row"
                            style={{ cursor: 'pointer' }}
                            onClick={() => addExerciseToDay(ex)}
                          >
                            <div style={{ flex: 1, fontSize: 13 }}>{ex.name}</div>
                            <div className="tag-wrap">
                              {ex.muscles?.filter((m: any) => m.isPrimary).map((m: any) => (
                                <span key={m.id} className="tag">{m.muscle.name}</span>
                              ))}
                            </div>
                            <button
                              className="btn btn-sm btn-icon btn-secondary"
                              title="Preview exercise"
                              onClick={(e) => { e.stopPropagation(); setPreviewExId(ex.id) }}
                            >
                              <Eye size={13} />
                            </button>
                            <Plus size={14} color="var(--primary)" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button className="btn btn-secondary" onClick={() => handleCreate(false)} disabled={creating}>
                Save as Draft
              </button>
              <button className="btn btn-primary" onClick={() => handleCreate(true)} disabled={creating}>
                {creating ? 'Publishing...' : '✓ Publish Split'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Split"
        message="This will permanently delete this split and unlink all users from it. This cannot be undone."
        confirmLabel="Delete Split"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        danger
      />

      <ExercisePreviewModal
        exerciseId={previewExId}
        onClose={() => setPreviewExId(null)}
      />
    </div>
  )
}

function Search({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
}
