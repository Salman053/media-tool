interface HeaderProps {
  fileCount: number
  onClear?: () => void
}

export default function Header({ fileCount, onClear }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-icon">M</div>
      <h1>Media Tool</h1>
      <span className="header-version">v0.1.0</span>
      <div style={{ flex: 1 }} />
      {fileCount > 0 && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={onClear}
          style={{ fontSize: 12 }}
        >
          Clear All
        </button>
      )}
    </header>
  )
}
