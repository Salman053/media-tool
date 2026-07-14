import { useState, useMemo } from 'react'

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: 10, border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'monospace',
  background: 'var(--surface)', color: 'var(--text)', outline: 'none',
  resize: 'vertical', lineHeight: 1.6, wordBreak: 'break-all',
}

interface JwtParts {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  raw: string[]
}

// sample tokens with expiry far in the future so they show as valid
const SAMPLES = [
  {
    label: 'User Auth',
    desc: 'Standard access token with user claims',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzE5MDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.RXaKQaETohuMTOiY5LgPesmU1uGpBPQ0HyJ-Y2nl4BI',
  },
  {
    label: 'API Service',
    desc: 'Machine-to-machine token with scopes',
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNlcnZpY2Uta2V5LTEifQ.eyJpc3MiOiJodHRwczovL2FwaS5leGFtcGxlLmNvbSIsInN1YiI6InNlcnZpY2UtYWNjb3VudCIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tL3YyIiwic2NvcGUiOlsicmVhZDpkYXRhIiwid3JpdGU6ZGF0YSJdLCJpYXQiOjE3MTkwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.P7FzYmJqJ0FYHV6E9uHJKFKFNe6-58HYfqPW3UF7Bzy5POA_sBZKh1KtG_B2stZWBAiF2uK3gE10n6t29sTmhD8LyqW6jsVtBt-Fly0s59O',
  },
  {
    label: 'ID Token',
    desc: 'OpenID Connect identity token',
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im9pZGMtand0LTEifQ.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicGljdHVyZSI6Imh0dHBzOi8vZXhhbXBsZS5jb20vYXZhdGFyLnBuZyIsImF1ZCI6Im15LWFwcCIsImlhdCI6MTcxOTAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5LCJhdF9oYXNoIjoieHl6YWJjZGVmMTIzIn0.GzR_A-xDXHLVMWvI_1vSSn32AYCDUAY1Fx5tfnclxJEQh0EdY3iJp7bBP2Bxt_4vDgBYBAH9Rc4vmlg7POUJMwkM9Bqc6eCAxjLQ-v21q38',
  },
  {
    label: 'Expired',
    desc: 'Token with expired timestamp',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUwMDAwMDAwMCwiZXhwIjoxNTAwMDAwNjAwfQ.dGhlIHNpZ25hdHVyZSBpcyBub3QgdmFsaWQgbG9s',
  },
]

function decodeJwt(token: string): JwtParts | string {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return 'Invalid JWT: expected 3 dot-separated segments'
  try {
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))
    return { header, payload, signature: parts[2], raw: parts }
  } catch {
    return 'Invalid JWT: failed to base64-decode header/payload'
  }
}

function isExpired(exp?: number): boolean | null {
  if (!exp) return null
  return Date.now() / 1000 > exp
}

export default function JwtPanel() {
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState('')

  const result = useMemo(() => decodeJwt(token), [token])

  const parts = result && typeof result !== 'string' ? result : null
  const error = typeof result === 'string' ? result : null

  const exp = parts?.payload?.exp as number | undefined
  const nbf = parts?.payload?.nbf as number | undefined
  const iat = parts?.payload?.iat as number | undefined
  const expired = isExpired(exp)

  const copyJson = (label: string, json: string) => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(''), 1500)
    })
  }

  return (
    <div style={{ padding: 12 }}>
      {/* Examples */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            className="btn btn-secondary btn-sm"
            onClick={() => setToken(s.token)}
            title={s.desc}
            style={{ fontSize: 10, padding: '3px 8px' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <textarea
        placeholder="Paste a JWT token here (header.payload.signature)"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        rows={3}
        style={{ ...INPUT_STYLE, marginBottom: 10 }}
      />

      {error && (
        <div style={{ padding: 8, background: 'var(--error-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>
          {error}
        </div>
      )}

      {parts && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Header */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span>HEADER: ALGORITHM &amp; TOKEN TYPE</span>
              <button className="btn btn-secondary btn-sm" onClick={() => copyJson('header', JSON.stringify(parts.header, null, 2))} style={{ fontSize: 10, padding: '2px 8px' }}>
                {copied === 'header' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre style={{ margin: 0, padding: 10, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'var(--surface)' }}>
              {JSON.stringify(parts.header, null, 2)}
            </pre>
          </div>

          {/* Payload */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span>PAYLOAD: DATA</span>
              <button className="btn btn-secondary btn-sm" onClick={() => copyJson('payload', JSON.stringify(parts.payload, null, 2))} style={{ fontSize: 10, padding: '2px 8px' }}>
                {copied === 'payload' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre style={{ margin: 0, padding: 10, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'var(--surface)' }}>
              {JSON.stringify(parts.payload, null, 2)}
            </pre>
          </div>

          {/* Timestamp hints */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {iat !== undefined && (
              <div style={{ padding: '4px 10px', borderRadius: 99, fontSize: 10, background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                Issued: {new Date(iat * 1000).toLocaleString()}
              </div>
            )}
            {nbf !== undefined && (
              <div style={{ padding: '4px 10px', borderRadius: 99, fontSize: 10, background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                Not Before: {new Date(nbf * 1000).toLocaleString()}
              </div>
            )}
            {exp !== undefined && (
              <div style={{ padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: expired ? 'var(--error-bg)' : '#f0fdf4', color: expired ? 'var(--error)' : '#16a34a' }}>
                {expired ? 'EXPIRED' : 'Valid until'}: {new Date(exp * 1000).toLocaleString()}
              </div>
            )}
          </div>

          {/* Signature */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <div style={{ padding: '6px 10px', background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
              SIGNATURE
            </div>
            <div style={{ padding: 10, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--text-muted)', background: 'var(--surface)' }}>
              {parts.signature}
            </div>
          </div>

          {/* Raw segments */}
          <details style={{ fontSize: 11 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 }}>Raw Segments</summary>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {parts.raw.map((seg, i) => (
                <code key={i} style={{ padding: 6, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 10, wordBreak: 'break-all' }}>
                  [{i}] {seg}
                </code>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
