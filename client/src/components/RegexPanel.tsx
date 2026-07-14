import { useState, useMemo } from 'react'

const STYLE_INPUT: React.CSSProperties = {
  width: '100%', padding: 10, border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'monospace',
  background: 'var(--surface)', color: 'var(--text)', outline: 'none',
  resize: 'vertical', lineHeight: 1.6, tabSize: 2,
}

const FLAG_DEFS = [
  { id: 'g', label: 'g', desc: 'global' },
  { id: 'i', label: 'i', desc: 'case-insensitive' },
  { id: 'm', label: 'm', desc: 'multiline' },
  { id: 's', label: 's', desc: 'dotall' },
  { id: 'u', label: 'u', desc: 'unicode' },
  { id: 'y', label: 'y', desc: 'sticky' },
  { id: 'd', label: 'd', desc: 'indices' },
]

const EXAMPLES = [
  {
    title: 'Match Email Addresses',
    desc: 'Finds all email patterns in text',
    pattern: '[\\w.-]+@[\\w.-]+\\.\\w+',
    flags: 'g',
    text: 'Contact us at support@example.com or sales@shop.org for help.\nYou can also reach admin@my-site.io.',
    mode: 'match' as const,
    matchLabel: '2 emails',
  },
  {
    title: 'Extract Phone Numbers',
    desc: 'Matches US/International phone formats',
    pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
    flags: 'g',
    text: 'Call: (555) 123-4567 or 888-555-0199.\nOffice: 212.555.0148',
    mode: 'match' as const,
    matchLabel: '3 phone numbers',
  },
  {
    title: 'Find Duplicate Words',
    desc: 'Catches repeated words (e.g. "the the")',
    pattern: '\\b(\\w+)\\s+\\1\\b',
    flags: 'gi',
    text: 'This is is a test. I really really love regex.\nBut but sometimes it gets tricky tricky.',
    mode: 'match' as const,
    matchLabel: '3 duplicates',
  },
  {
    title: 'Extract URLs',
    desc: 'Matches http/https URLs from text',
    pattern: 'https?://[\\w./?=&%-]+',
    flags: 'g',
    text: 'Visit https://example.com/path?q=1 and http://test.io.\nDocs at https://docs.example.org/api/v2.',
    mode: 'match' as const,
    matchLabel: '3 URLs',
  },
  {
    title: 'Capture Groups — Parse Logs',
    desc: 'Extracts date, level, and message from log lines',
    pattern: '^(\\d{4}-\\d{2}-\\d{2}) (ERROR|INFO|WARN) (.+)$',
    flags: 'gm',
    text: '2024-01-15 ERROR Connection timeout\n2024-01-15 INFO User logged in\n2024-01-16 WARN Disk at 85%',
    mode: 'match' as const,
    matchLabel: '3 log entries with groups',
  },
  {
    title: 'Replace — Mask Credit Cards',
    desc: 'Replaces all but last 4 digits with asterisks',
    pattern: '\\d{4}[ -]?\\d{4}[ -]?\\d{4}[ -]?(\\d{4})',
    flags: 'g',
    replacement: '****-****-****-$1',
    text: 'Card: 4111-1111-1111-1111\nCard: 5500 0000 0000 0004',
    mode: 'replace' as const,
    matchLabel: '2 cards masked',
  },
  {
    title: 'Replace — Format Dates',
    desc: 'Converts YYYY-MM-DD to DD/MM/YYYY',
    pattern: '(\\d{4})-(\\d{2})-(\\d{2})',
    flags: 'g',
    replacement: '$3/$2/$1',
    text: '2024-01-15 — meeting\n2024-12-25 — holiday',
    mode: 'replace' as const,
    matchLabel: '2 dates reformatted',
  },
]

export default function RegexPanel() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('gm')
  const [testText, setTestText] = useState('')
  const [replacement, setReplacement] = useState('')
  const [mode, setMode] = useState<'match' | 'replace'>('match')
  const [showExamples, setShowExamples] = useState(false)

  function applyExample(ex: typeof EXAMPLES[number]) {
    setPattern(ex.pattern)
    setFlags(ex.flags)
    setTestText(ex.text)
    setReplacement(ex.replacement ?? '')
    setMode(ex.mode)
    setShowExamples(false)
  }

  function toggleFlag(f: string) {
    setFlags((prev) => prev.includes(f) ? prev.replace(f, '') : prev + f)
  }

  const result = useMemo(() => {
    if (!pattern.trim()) return null
    try {
      const re = new RegExp(pattern, flags)
      if (mode === 'replace') {
        if (!replacement.trim()) return { type: 'replace' as const, count: 0, text: '(no replacement text)' }
        const result = testText.replace(re, replacement)
        const count = (testText.match(re) || []).length
        return { type: 'replace' as const, count, text: result }
      }
      const matches = [...testText.matchAll(re)]
      if (matches.length === 0) return { type: 'match' as const, count: 0, matches: [] }
      return {
        type: 'match' as const,
        count: matches.length,
        matches: matches.map((m) => ({
          full: m[0],
          index: m.index ?? -1,
          groups: m.slice(1).filter((g) => g !== undefined) as string[],
          named: m.groups ?? {},
        })),
      }
    } catch (e) {
      return { type: 'error' as const, error: (e as Error).message }
    }
  }, [pattern, flags, testText, replacement, mode])

  const isValid = result && result.type !== 'error'

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        <button className={`btn ${mode === 'match' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setMode('match')}>Match</button>
        <button className={`btn ${mode === 'replace' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setMode('replace')}>Replace</button>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowExamples(!showExamples)} style={{ marginLeft: 'auto' }}>
          {showExamples ? 'Hide Examples' : 'Examples'}
        </button>
      </div>

      {showExamples && (
        <div style={{
          marginBottom: 10, padding: 10, background: 'var(--primary-light)',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8,
        }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.title}
              onClick={() => applyExample(ex)}
              style={{
                textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: 10, background: 'var(--surface)',
                fontFamily: 'inherit', transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{ex.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{ex.desc}</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                <code style={{ fontSize: 10, color: 'var(--primary)', background: 'var(--primary-light)', padding: '1px 5px', borderRadius: 3 }}>{ex.pattern}</code>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{ex.flags}</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 10, fontWeight: 500, color: 'var(--success)' }}>Finds {ex.matchLabel}</div>
            </button>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>Pattern</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            placeholder="Enter your regex pattern (e.g. \\d+|[a-z]+)"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            style={{ ...STYLE_INPUT, flex: 1 }}
          />
          <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            {FLAG_DEFS.map((f) => (
              <button
                key={f.id}
                className={`btn ${flags.includes(f.id) ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => toggleFlag(f.id)}
                title={f.desc}
                style={{ padding: '4px 6px', minWidth: 28, fontSize: 12, fontFamily: 'monospace' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'replace' && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>Replacement</div>
          <input
            placeholder="$1, $&, or plain text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            style={{ ...STYLE_INPUT }}
          />
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>
          Test Text <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({testText.length} chars)</span>
        </div>
        <textarea
          placeholder="Paste or type text to test against..."
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          rows={8}
          style={{ ...STYLE_INPUT }}
        />
      </div>

      {result && result.type === 'error' && (
        <div style={{ padding: 8, background: 'var(--error-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--error)' }}>
          {result.error}
        </div>
      )}

      {isValid && mode === 'match' && result.type === 'match' && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {result.count} match{result.count !== 1 ? 'es' : ''}
          </div>
          {result.matches.map((m, i) => (
            <div key={i} style={{
              padding: '6px 8px', marginBottom: 4, background: 'var(--primary-light)',
              borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'monospace',
              border: '1px solid var(--border)',
            }}>
              <div style={{ color: 'var(--primary)', fontWeight: 600 }}>#{i + 1} @ {m.index}</div>
              <div>{m.full}</div>
              {m.groups.length > 0 && (
                <div style={{ marginTop: 3, fontSize: 11, color: 'var(--text-secondary)' }}>
                  {m.groups.map((g, j) => (
                    <div key={j}>Group {j + 1}: <span style={{ color: 'var(--text)' }}>{g}</span></div>
                  ))}
                </div>
              )}
              {Object.keys(m.named).length > 0 && (
                <div style={{ marginTop: 3, fontSize: 11, color: 'var(--text-secondary)' }}>
                  {Object.entries(m.named).map(([k, v]) => (
                    <div key={k}>?&lt;{k}&gt;: <span style={{ color: 'var(--text)' }}>{v}</span></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isValid && mode === 'replace' && result.type === 'replace' && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {result.count} replacement{result.count !== 1 ? 's' : ''}
          </div>
          <div style={{
            padding: 10, background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)',
            fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            border: '1px solid var(--border)',
          }}>
            {result.text}
          </div>
        </div>
      )}
    </div>
  )
}
