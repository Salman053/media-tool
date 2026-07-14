import { useState, useMemo, useCallback } from 'react'

const STYLE: React.CSSProperties = {
  width: '100%', padding: '6px 10px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'monospace',
  background: 'var(--surface)', color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box',
}

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
]

function relative(t: number): string {
  const diff = Date.now() - t
  const abs = Math.abs(diff)
  const suffix = diff >= 0 ? 'ago' : 'from now'
  if (abs < 60000) return `${Math.round(abs / 1000)}s ${suffix}`
  if (abs < 3600000) return `${Math.round(abs / 60000)}m ${suffix}`
  if (abs < 86400000) return `${Math.round(abs / 3600000)}h ${suffix}`
  return `${Math.round(abs / 86400000)}d ${suffix}`
}

function parseTimestamp(s: string): Date | null {
  s = s.trim()
  if (!s) return null
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s)
    if (n > 1e15) return new Date(n)
    return new Date(n * 1000)
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function formatTz(d: Date, tz: string) {
  try {
    return d.toLocaleString('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return '—' }
}

type Mode = 'single' | 'batch'

export default function TimestampPanel() {
  const [mode, setMode] = useState<Mode>('single')
  const [unixSec, setUnixSec] = useState('')
  const [unixMs, setUnixMs] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [selectedTzs, setSelectedTzs] = useState<Set<string>>(new Set(['UTC', 'America/New_York', 'Asia/Tokyo']))
  const [err, setErr] = useState('')

  const now = useCallback(() => {
    const t = Date.now()
    setUnixSec(String(Math.floor(t / 1000)))
    setUnixMs(String(t))
    setDateStr(new Date(t).toISOString().slice(0, 19))
    setErr('')
  }, [])

  const singleResult = useMemo(() => {
    setErr('')
    const sec = unixSec.trim()
    const ms = unixMs.trim()
    const iso = dateStr.trim()
    let d: Date | null = null
    let src = ''

    if (sec && /^-?\d+(\.\d+)?$/.test(sec)) {
      d = new Date(parseFloat(sec) * 1000)
      src = 'Unix Seconds'
    } else if (ms && /^-?\d+(\.\d+)?$/.test(ms)) {
      d = new Date(parseFloat(ms))
      src = 'Unix Milliseconds'
    } else if (iso) {
      d = new Date(iso)
      src = 'Date String'
      if (isNaN(d.getTime())) { setErr('Invalid date string'); return null }
    }

    if (!d || isNaN(d.getTime())) return null

    const tzs: Record<string, string> = {}
    selectedTzs.forEach(tz => { tzs[tz] = formatTz(d, tz) })

    return { source: src, d, tzs }
  }, [unixSec, unixMs, dateStr, selectedTzs])

  const batchResults = useMemo(() => {
    const lines = batchInput.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return null
    const results: ({ input: string; valid: true; d: Date } | { input: string; valid: false })[] = []
    for (const line of lines) {
      const parts = line.split(/[,\t|;]+/).map(p => p.trim()).filter(Boolean)
      const raw = parts[0] || line
      const d = parseTimestamp(raw)
      if (d) results.push({ input: raw, valid: true as const, d })
      else results.push({ input: raw, valid: false as const })
    }
    return results
  }, [batchInput])

  const toggleTz = (tz: string) => {
    setSelectedTzs(prev => {
      const next = new Set(prev)
      if (next.has(tz)) next.delete(tz)
      else next.add(tz)
      return next
    })
  }

  return (
    <div style={{ padding: 12 }}>
      {/* mode tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <button className={`btn btn-sm ${mode === 'single' ? 'btn-primary' : ''}`} onClick={() => setMode('single')}>Single</button>
        <button className={`btn btn-sm ${mode === 'batch' ? 'btn-primary' : ''}`} onClick={() => setMode('batch')}>Batch</button>
      </div>

      {mode === 'single' ? (
        <>
          <div style={{ marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={now}>Now</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Unix Seconds</div>
              <input placeholder="e.g. 1719000000" value={unixSec} onChange={(e) => { setUnixSec(e.target.value); setUnixMs(''); setDateStr('') }} style={STYLE} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Unix Milliseconds</div>
              <input placeholder="e.g. 1719000000000" value={unixMs} onChange={(e) => { setUnixMs(e.target.value); setUnixSec(''); setDateStr('') }} style={STYLE} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Date String (ISO 8601)</div>
              <input placeholder="e.g. 2024-06-21T12:00:00Z" value={dateStr} onChange={(e) => { setDateStr(e.target.value); setUnixSec(''); setUnixMs('') }} style={STYLE} />
            </div>
          </div>

          {err && <div style={{ padding: 8, background: 'var(--error-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>{err}</div>}

          {singleResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              <ResultRow label="Source" value={singleResult.source} />
              <ResultRow label="Unix Seconds" value={String(Math.floor(singleResult.d.getTime() / 1000))} />
              <ResultRow label="Unix Milliseconds" value={String(singleResult.d.getTime())} />
              <ResultRow label="ISO 8601" value={singleResult.d.toISOString()} mono />
              <ResultRow label="Relative" value={relative(singleResult.d.getTime())} />
              <ResultRow label="Weekday" value={singleResult.d.toLocaleDateString(undefined, { weekday: 'long' })} />
            </div>
          )}

          {/* timezone selector */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Timezones</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {TIMEZONES.map(tz => (
                <label key={tz} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, cursor: 'pointer', padding: '2px 6px', background: selectedTzs.has(tz) ? 'var(--primary-light)' : 'transparent', borderRadius: 'var(--radius-sm)' }}>
                  <input type="checkbox" checked={selectedTzs.has(tz)} onChange={() => toggleTz(tz)} style={{ margin: 0 }} />
                  {tz.split('/').pop()!.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>

          {singleResult && selectedTzs.size > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Time in Selected Zones</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[...selectedTzs].map(tz => (
                  <ResultRow key={tz} label={tz} value={singleResult.tzs[tz]} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Paste timestamps (one per line, comma/tab separated for labels)</div>
            <textarea
              placeholder="1719000000&#10;1719000000000&#10;2024-06-21T12:00:00Z&#10;1718000000, Start of event&#10;1719500000, End of event"
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              rows={8}
              style={{ ...STYLE, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }}
            />
          </div>

          {batchResults && batchResults.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--primary-light)' }}>
                    <th style={thStyle}>Input</th>
                    <th style={thStyle}>Label</th>
                    <th style={thStyle}>Unix Sec</th>
                    <th style={thStyle}>ISO 8601</th>
                    <th style={thStyle}>UTC</th>
                    <th style={thStyle}>Local</th>
                    <th style={thStyle}>Relative</th>
                    {[...selectedTzs].map(tz => (
                      <th key={tz} style={thStyle}>{tz.split('/').pop()!.replace('_', ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map((r, i) => {
                    if (!r.valid) {
                      return (
                        <tr key={i}>
                          <td style={tdStyle} colSpan={7 + selectedTzs.size}><span style={{ color: 'var(--error)' }}>✗ {r.input}</span></td>
                        </tr>
                      )
                    }
                    const parts = r.input.split(/[,;\t|]+/).map(p => p.trim())
                    const label = parts.length > 1 ? parts.slice(1).join(' ') : ''
                    return (
                      <tr key={i}>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{parts[0]}</td>
                        <td style={tdStyle}>{label || '—'}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{Math.floor(r.d.getTime() / 1000)}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 10 }}>{r.d.toISOString()}</td>
                        <td style={tdStyle}>{r.d.toUTCString()}</td>
                        <td style={tdStyle}>{r.d.toLocaleString()}</td>
                        <td style={tdStyle}>{relative(r.d.getTime())}</td>
                        {[...selectedTzs].map(tz => (
                          <td key={tz} style={tdStyle}>{formatTz(r.d, tz)}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '5px 6px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 10, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)',
}
const tdStyle: React.CSSProperties = {
  padding: '4px 6px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
}

function ResultRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', fontSize: 11 }}>
      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'monospace' : 'inherit', color: 'var(--text)', wordBreak: 'break-all', textAlign: 'right', marginLeft: 12 }}>{value}</span>
    </div>
  )
}
