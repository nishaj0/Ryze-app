import { useEffect, useState, useCallback } from 'react'
import { Search, Dumbbell, Eye, SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react'
import { getExercises, getExerciseFilters } from '../api'
import { PageLoader, Pagination } from '../components/UI'
import ExercisePreviewModal from '../components/ExercisePreviewModal'

interface Exercise {
  id: string; name: string; category?: string; equipment?: string;
  level?: string; force?: string; mechanic?: string;
  muscles: { isPrimary: boolean; muscle: { name: string } }[]
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewExId, setPreviewExId] = useState<string | null>(null)
  const [filters, setFilters] = useState({ muscle: '', level: '', equipment: '', category: '', mechanic: '', force: '' })
  const [filterOptions, setFilterOptions] = useState<{ muscles: string[]; equipment: string[]; categories: string[]; levels: string[]; mechanics: string[]; forces: string[] }>({ muscles: [], equipment: [], categories: [], levels: [], mechanics: [], forces: [] })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    getExerciseFilters()
      .then((d: any) => setFilterOptions(d))
      .catch(console.error)
  }, [])

  const activeFilterCount = [filters.muscle, filters.level, filters.equipment, filters.category, filters.mechanic, filters.force].filter(Boolean).length

  const updateFilter = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ muscle: '', level: '', equipment: '', category: '', mechanic: '', force: '' })
    setPage(1)
  }

  const clearSingleFilter = (key: string) => {
    setFilters(f => ({ ...f, [key]: '' }))
    setPage(1)
  }

  const load = useCallback(() => {
    setLoading(true)
    const params: Record<string, any> = { page, limit: 30, search }
    if (filters.muscle) params.muscle = filters.muscle
    if (filters.level) params.level = filters.level
    if (filters.equipment) params.equipment = filters.equipment
    if (filters.category) params.category = filters.category
    if (filters.mechanic) params.mechanic = filters.mechanic
    if (filters.force) params.force = filters.force
    getExercises(params)
      .then((d: any) => { setExercises(d.exercises); setTotal(d.total); setTotalPages(d.totalPages) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, search, filters])

  useEffect(() => { load() }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const levelColor = (l?: string) => {
    if (l === 'beginner') return 'badge-success'
    if (l === 'intermediate') return 'badge-warning'
    if (l === 'expert') return 'badge-danger'
    return 'badge-muted'
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Exercises</div>
          <div className="section-sub">{total.toLocaleString()} exercises in library</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <form onSubmit={handleSearch} className="row" style={{ gap: 8 }}>
            <div className="search-wrap">
              <Search size={14} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search exercises..."
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
          <button
            className={`btn btn-sm ${showFilters || activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilters(s => !s)}
            style={{ whiteSpace: 'nowrap' }}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                background: showFilters ? 'white' : 'var(--primary)',
                color: showFilters ? 'var(--primary)' : 'white',
                borderRadius: 10, padding: '0 6px', fontSize: 10,
                minWidth: 18, height: 18, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>{activeFilterCount}</span>
            )}
            {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="tag-wrap" style={{ marginBottom: 16 }}>
          {(['muscle', 'level', 'equipment', 'category', 'mechanic', 'force'] as const).map(k => {
            const v = filters[k]
            if (!v) return null
            return (
              <span key={k} className="tag tag-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                {v}
                <button onClick={() => clearSingleFilter(k)}
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

      {/* Collapsible filter panel */}
      {showFilters && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Muscle</label>
              <select value={filters.muscle} onChange={e => updateFilter('muscle', e.target.value)}>
                <option value="">All muscles</option>
                {filterOptions.muscles.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Level</label>
              <select value={filters.level} onChange={e => updateFilter('level', e.target.value)}>
                <option value="">All levels</option>
                {filterOptions.levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Equipment</label>
              <select value={filters.equipment} onChange={e => updateFilter('equipment', e.target.value)}>
                <option value="">All equipment</option>
                {filterOptions.equipment.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Category</label>
              <select value={filters.category} onChange={e => updateFilter('category', e.target.value)}>
                <option value="">All categories</option>
                {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Mechanic</label>
              <select value={filters.mechanic} onChange={e => updateFilter('mechanic', e.target.value)}>
                <option value="">All mechanics</option>
                {filterOptions.mechanics.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Force</label>
              <select value={filters.force} onChange={e => updateFilter('force', e.target.value)}>
                <option value="">All force types</option>
                {filterOptions.forces.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button className="btn btn-sm btn-secondary" onClick={clearFilters} style={{ marginTop: 12 }}>
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {loading ? <PageLoader /> : (
        <>
          <div className="table-wrap card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Primary Muscles</th>
                  <th>Category</th>
                  <th>Equipment</th>
                  <th>Level</th>
                  <th>Force</th>
                  <th>Mechanic</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map(ex => {
                  const primary = ex.muscles.filter(m => m.isPrimary).map(m => m.muscle.name)
                  const secondary = ex.muscles.filter(m => !m.isPrimary).map(m => m.muscle.name)
                  return (
                    <tr key={ex.id}>
                      <td>
                        <div className="row">
                          <div style={{ width: 32, height: 32, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Dumbbell size={16} color="var(--primary)" />
                          </div>
                          <span style={{ fontWeight: 600 }}>{ex.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="tag-wrap">
                          {primary.map(m => <span key={m} className="tag tag-primary">{m}</span>)}
                          {secondary.slice(0, 2).map(m => <span key={m} className="tag">{m}</span>)}
                        </div>
                      </td>
                      <td><span className="tag">{ex.category || '—'}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13, textTransform: 'capitalize' }}>{ex.equipment || '—'}</td>
                      <td>
                        {ex.level ? <span className={`badge ${levelColor(ex.level)}`}>{ex.level}</span> : '—'}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{ex.force || '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{ex.mechanic || '—'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-icon btn-secondary"
                          title="Preview exercise"
                          onClick={() => setPreviewExId(ex.id)}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {exercises.length === 0 && (
              <div className="empty-state">
                <Dumbbell />
                <h3>No exercises found</h3>
                <p>Try a different search</p>
              </div>
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={30} onPage={setPage} />
        </>
      )}

      <ExercisePreviewModal
        exerciseId={previewExId}
        onClose={() => setPreviewExId(null)}
      />
    </div>
  )
}
