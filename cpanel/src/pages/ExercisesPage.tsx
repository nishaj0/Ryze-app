import { useEffect, useState, useCallback } from 'react'
import { Search, Dumbbell, Eye } from 'lucide-react'
import { getExercises } from '../api'
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

  const load = useCallback(() => {
    setLoading(true)
    getExercises({ page, limit: 30, search })
      .then((d: any) => { setExercises(d.exercises); setTotal(d.total); setTotalPages(d.totalPages) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, search])

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
      </div>

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
