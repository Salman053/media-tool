import { useState, useCallback } from 'react'
import type { UploadedFile, RenameEntry } from '../types'

interface Props {
  files: UploadedFile[]
  onRename: (entries: RenameEntry[]) => void
  disabled: boolean
}

export default function RenamePanel({ files, onRename, disabled }: Props) {
  const [order, setOrder] = useState<UploadedFile[]>(files)
  const [names, setNames] = useState<string[]>(files.map((f) => f.originalName))

  const moveItem = useCallback((from: number, to: number) => {
    if (to < 0 || to >= order.length) return
    const o = [...order]; const [m] = o.splice(from, 1); o.splice(to, 0, m); setOrder(o)
    const n = [...names]; const [nm] = n.splice(from, 1); n.splice(to, 0, nm); setNames(n)
  }, [order, names])

  const handleNameChange = useCallback((idx: number, value: string) => {
    const next = [...names]
    next[idx] = value
    const base = value.replace(/[-\s]?\d*$/, '').trim()
    if (base && base !== value) {
      let c = 1
      for (let i = 0; i < next.length; i++) {
        if (i === idx) continue
        next[i] = `${base}-${c}`
        c++
      }
    }
    setNames(next)
  }, [names])

  const entries: RenameEntry[] = order.map((f, i) => ({
    originalName: f.originalName,
    newName: names[i],
  }))

  return (
    <div className="rename-panel" style={{ padding: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
        Type a name — rest auto-number. Use ▲▼ to reorder.
      </div>
      <button className="btn btn-primary btn-action" disabled={disabled} onClick={() => onRename(entries)} style={{ marginBottom: 10 }}>
        Rename {entries.length} File{entries.length > 1 ? 's' : ''}
      </button>
      <div className="rename-list" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        {order.map((f, i) => (
          <div key={f.id} className="rename-row" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderBottom: i < order.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button className="btn btn-secondary" style={{ padding: 0, width: 18, height: 14, fontSize: 8, lineHeight: '10px' }} disabled={i === 0} onClick={() => moveItem(i, i - 1)}>▲</button>
              <button className="btn btn-secondary" style={{ padding: 0, width: 18, height: 14, fontSize: 8, lineHeight: '10px' }} disabled={i === order.length - 1} onClick={() => moveItem(i, i + 1)}>▼</button>
            </div>
            <span style={{ width: 20, color: 'var(--text-muted)', textAlign: 'right', fontSize: 10 }}>{i + 1}</span>
            <span style={{ flex: '0 0 auto', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 11 }} title={f.originalName}>{f.originalName}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>→</span>
            <input className="settings-select" style={{ flex: 1, fontSize: 12, minWidth: 0 }} value={names[i]} onChange={(e) => handleNameChange(i, e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  )
}
