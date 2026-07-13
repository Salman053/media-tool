import type { ToolMode } from '../types'

interface ToolDef {
  id: ToolMode
  name: string
  description: string
  details: string
  icon: JSX.Element
}

const TOOLS: ToolDef[] = [
  {
    id: 'convert',
    name: 'Convert',
    description: 'Change image format',
    details: 'Convert between WebP, PNG, JPEG, AVIF, TIFF with adjustable quality.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    id: 'resize',
    name: 'Resize',
    description: 'Resize to exact dimensions',
    details: 'Scale images by width, height, or both. Smart fit modes: cover, contain, fill, inside, outside.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" />
        <polyline points="15 19 12 22 9 19" /><polyline points="19 9 22 12 19 15" />
        <line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    id: 'effects',
    name: 'Effects',
    description: 'Artistic filters & adjustments',
    details: 'Apply blur, sharpen, grayscale, sepia, negate, noise, edge detect, oil paint, charcoal, implode, swirl, pixelate.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  {
    id: 'thumbnail',
    name: 'Thumbnail',
    description: 'Generate square thumbnails',
    details: 'Batch-create uniform square thumbnails from any images using ImageMagick. Perfect for galleries, avatars, and previews.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
]

interface ToolGridProps {
  onSelect: (mode: ToolMode) => void
}

export default function ToolGrid({ onSelect }: ToolGridProps) {
  return (
    <div className="tool-grid-wrapper">
      <div className="tool-grid-header">
        <h2>Choose a tool</h2>
        <p>Upload images then convert, resize, apply effects, or generate thumbnails.</p>
      </div>
      <div className="tool-grid">
        {TOOLS.map((tool) => (
          <button key={tool.id} className="tool-card" onClick={() => onSelect(tool.id)}>
            <div className="tool-card-icon">{tool.icon}</div>
            <div className="tool-card-content">
              <div className="tool-card-name">{tool.name}</div>
              <div className="tool-card-desc">{tool.description}</div>
              <div className="tool-card-details">{tool.details}</div>
            </div>
            <div className="tool-card-action">
              <span>Get Started</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
