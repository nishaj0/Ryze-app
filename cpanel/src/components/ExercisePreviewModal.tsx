import { useCallback, useEffect, useState } from 'react'
import { X, Dumbbell, Lightbulb, Repeat } from 'lucide-react'
import { getExercise } from '../api'
import { PageLoader } from './UI'

interface ExerciseImage { url: string; order: number }
interface ExerciseMuscle { isPrimary: boolean; muscle: { name: string } }
interface ExerciseAlternative { reason: string; alternative: { name: string } }

interface ExerciseDetail {
  id: string; name: string; force?: string | null; level?: string | null;
  mechanic?: string | null; equipment?: string | null; category?: string | null;
  instructions?: string | null;
  muscles: ExerciseMuscle[];
  images: ExerciseImage[];
  alternativesFrom?: ExerciseAlternative[];
}

interface Props {
  exerciseId: string | null
  onClose: () => void
}

function ExerciseImageCrossfade({ images }: { images: ExerciseImage[] }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setIdx(p => (p + 1) % images.length), 2000)
    return () => clearInterval(t)
  }, [images.length])

  if (!images || images.length === 0) {
    return (
      <div style={{
        width: '100%', height: 200, borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-secondary)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <Dumbbell size={36} />
          <div style={{ fontSize: 12, marginTop: 8 }}>No images</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative', width: '100%', height: 240,
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      background: 'var(--surface-secondary)', border: '1px solid var(--border)',
    }}>
      {images.map((img, i) => (
        <img
          key={img.url}
          src={img.url}
          alt={`${i + 1}`}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', background: 'var(--surface-secondary)',
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />
      ))}
      {images.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6, background: 'rgba(255,255,255,0.85)',
          padding: '4px 8px', borderRadius: 12, backdropFilter: 'blur(4px)',
        }}>
          {images.map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: 3,
              background: i === idx ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

const levelBadge = (l?: string | null) => {
  if (!l) return null
  if (l === 'beginner') return 'badge-success'
  if (l === 'intermediate') return 'badge-warning'
  if (l === 'expert') return 'badge-danger'
  return 'badge-muted'
}

export default function ExercisePreviewModal({ exerciseId, onClose }: Props) {
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadExercise = useCallback(() => {
    if (!exerciseId) return
    setLoading(true); setError(''); setExercise(null)
    getExercise(exerciseId)
      .then((d: { exercise: ExerciseDetail }) => setExercise(d.exercise))
      .catch(() => setError('Failed to load exercise'))
      .finally(() => setLoading(false))
  }, [exerciseId])

  useEffect(() => { loadExercise() }, [loadExercise])

  if (!exerciseId) return null

  const primaryMuscles = exercise?.muscles?.filter(m => m.isPrimary).map(m => m.muscle.name) || []
  const secondaryMuscles = exercise?.muscles?.filter(m => !m.isPrimary).map(m => m.muscle.name) || []
  const instructions = exercise?.instructions?.split('\n').map(s => s.trim()).filter(Boolean) || []
  const alternatives = exercise?.alternativesFrom || []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Exercise Preview</span>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}><X size={14} /></button>
        </div>

        {loading && <PageLoader />}

        {error && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--danger)', fontSize: 14 }}>{error}</div>
        )}

        {exercise && (
          <>
            {/* Name + equipment */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{exercise.name}</div>
              {exercise.equipment && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, textTransform: 'capitalize' }}>
                  {exercise.equipment}
                </div>
              )}
            </div>

            {/* Images */}
            <div style={{ marginBottom: 16 }}>
              <ExerciseImageCrossfade images={exercise.images} />
            </div>

            {/* Meta badges */}
            <div className="tag-wrap" style={{ marginBottom: 16, gap: 6 }}>
              {exercise.level && <span className={`badge ${levelBadge(exercise.level)}`}>{exercise.level}</span>}
              {exercise.mechanic && <span className="badge badge-muted">{exercise.mechanic}</span>}
              {exercise.force && <span className="badge badge-muted">{exercise.force}</span>}
              {exercise.category && <span className="badge badge-muted">{exercise.category}</span>}
            </div>

            {/* Muscles */}
            {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.04em' }}>MUSCLES WORKED</div>
                {primaryMuscles.length > 0 && (
                  <div className="tag-wrap" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginRight: 4 }}>Primary:</span>
                    {primaryMuscles.map(m => <span key={m} className="tag tag-primary" style={{ textTransform: 'capitalize' }}>{m}</span>)}
                  </div>
                )}
                {secondaryMuscles.length > 0 && (
                  <div className="tag-wrap">
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, marginRight: 4 }}>Secondary:</span>
                    {secondaryMuscles.map(m => <span key={m} className="tag" style={{ textTransform: 'capitalize' }}>{m}</span>)}
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            {instructions.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Lightbulb size={14} color="var(--primary)" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.04em' }}>HOW TO PERFORM</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {instructions.map((step, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Repeat size={14} color="var(--text-secondary)" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>ALTERNATIVES</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {alternatives.map((a, i) => (
                    <div key={i} className="exercise-row" style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-secondary)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.alternative.name}</div>
                      {a.reason && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.reason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}