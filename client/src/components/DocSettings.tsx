import type { DocConvertSettings } from '../types'

interface Props {
  settings: DocConvertSettings
  onChange: (s: DocConvertSettings) => void
}

const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'Word (DOCX)' },
  { value: 'doc', label: 'Word (DOC)' },
  { value: 'odt', label: 'OpenDocument (ODT)' },
  { value: 'txt', label: 'Plain Text (TXT)' },
  { value: 'html', label: 'HTML' },
  { value: 'rtf', label: 'Rich Text (RTF)' },
  { value: 'epub', label: 'EPUB' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'xls', label: 'Excel (XLS)' },
  { value: 'ods', label: 'Spreadsheet (ODS)' },
  { value: 'pptx', label: 'PowerPoint (PPTX)' },
  { value: 'ppt', label: 'PowerPoint (PPT)' },
  { value: 'odp', label: 'Presentation (ODP)' },
  { value: 'csv', label: 'CSV' },
  { value: 'png', label: 'PNG Image' },
  { value: 'jpg', label: 'JPEG Image' },
  { value: 'svg', label: 'SVG Vector' },
  { value: 'xml', label: 'Word 2003 XML' },
  { value: 'bmp', label: 'BMP Image' },
  { value: 'tiff', label: 'TIFF Image' },
  { value: 'gif', label: 'GIF Image' },
]

export default function DocSettingsBar({ settings, onChange }: Props) {
  return (
    <div className="settings-bar">
      <div className="settings-group">
        <span className="settings-label">Convert to:</span>
        <select className="settings-select" value={settings.format} onChange={(e) => onChange({ format: e.target.value })}>
          {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
    </div>
  )
}
