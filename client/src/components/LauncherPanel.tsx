import { useState } from 'react'

const DEFAULT_URLS = `https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23
https://www.pexels.com/search/videos/motion/id=23`

export default function LauncherPanel() {
  const saved = localStorage.getItem('launcher-urls')
  const [text, setText] = useState(saved || '')

  const save = (val: string) => {
    setText(val)
    localStorage.setItem('launcher-urls', val)
  }

  const openAll = () => {
    const urls = text.split('\n').map((l) => l.trim()).filter(Boolean)
    for (const url of urls) {
      const u = url.startsWith('http') ? url : `https://${url}`
      window.open(u, '_blank')
    }
  }

  const loadDefault = () => save(DEFAULT_URLS)
  const clearAll = () => save('')

  return (
    <div className="launcher-panel" style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={loadDefault}>Load Sample</button>
        <button className="btn btn-secondary btn-sm" onClick={clearAll}>Clear</button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {text.split('\n').filter(Boolean).length} URL(s)
        </span>
      </div>
      <textarea
        className="launcher-textarea"
        placeholder="Paste URLs here, one per line..."
        value={text}
        onChange={(e) => save(e.target.value)}
        rows={12}
        style={{
          width: '100%',
          padding: 10,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          fontFamily: 'monospace',
          resize: 'vertical',
          background: 'var(--surface)',
          color: 'var(--text)',
          outline: 'none',
          lineHeight: 1.6,
        }}
      />
      <button
        className="btn btn-primary btn-action"
        style={{ marginTop: 10 }}
        disabled={!text.trim()}
        onClick={openAll}
      >
        Open All Tabs
      </button>
    </div>
  )
}
