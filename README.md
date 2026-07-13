# Media Tool

A professional media processing application with a plugin-based architecture. Convert, resize, apply effects, and generate thumbnails through both a CLI and a web UI.

## Features

- **Image Convert** — Convert between WebP, PNG, JPEG, AVIF, and TIFF with adjustable quality (powered by **sharp**)
- **Image Resize** — Resize to exact dimensions with smart fit modes: cover, contain, fill, inside, outside
- **Artistic Effects** — 12 effects powered by **ImageMagick**: blur, sharpen, grayscale, sepia, negate, noise, edge detect, oil paint, charcoal, implode, swirl, pixelate
- **Thumbnail Generation** — Batch-create uniform square thumbnails at any size
- **Bulk Processing** — Upload and process multiple files at once
- **Batch Download** — Download results individually or as a single ZIP archive
- **Drag & Drop UI** — Modern web interface with drag-and-drop file upload and live previews
- **CLI** — Full command-line interface for scripting and CI/CD pipeline automation
- **Plugin Architecture** — Easy to extend with new formats, operations, and media types

## Tech Stack

| Layer        | Technology                                                |
|-------------|-----------------------------------------------------------|
| Language     | TypeScript (strict mode, ESM)                             |
| Image Engine | [sharp](https://sharp.pixelplumbing.com/) + [ImageMagick](https://imagemagick.org) |
| Server       | Express.js                                                |
| Frontend     | React 18 + Vite + TypeScript                              |
| Build        | tsup (ESBuild-based bundler)                              |
| Testing      | Vitest                                                    |
| CLI          | Native Node.js (no framework)                             |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm

**Effects and Thumbnail tools require [ImageMagick](https://imagemagick.org/script/download.php) installed on your system.**  
Convert and Resize tools work with sharp (no external dependency).

## Project Structure

```
media-tool/
├── src/
│   ├── index.ts                      # CLI entry
│   ├── server.ts                     # Express server (API + static file serving)
│   ├── types/index.ts                # Shared TypeScript interfaces
│   ├── commands/                     # CLI commands
│   │   ├── registry.ts
│   │   ├── convert.ts
│   │   ├── resize.ts
│   │   ├── effects.ts
│   │   └── thumbnail.ts
│   ├── processors/                   # Format conversion (sharp-based)
│   │   ├── registry.ts
│   │   └── image/
│   │       ├── processor.ts
│   │       └── formats/webp.ts
│   ├── operations/                   # Image operations
│   │   └── image/
│   │       ├── resize.ts             # Sharp-based resize
│   │       ├── effects.ts            # ImageMagick effects
│   │       └── thumbnail.ts          # ImageMagick thumbnails
│   ├── engines/                      # Processing engines
│   │   └── imagemagick.ts            # ImageMagick CLI wrapper
│   └── utils/
├── client/                           # React frontend
│   ├── src/
│   │   ├── App.tsx / App.css         # Main app
│   │   ├── api.ts                    # API client
│   │   ├── types.ts
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── ToolGrid.tsx          # Landing page with 4 tool cards
│   │       ├── UploadArea.tsx
│   │       ├── FileGrid.tsx
│   │       ├── SettingsBar.tsx       # Convert settings
│   │       ├── ResizeSettings.tsx    # Resize settings
│   │       ├── EffectsSettings.tsx   # Effects settings (12 effects)
│   │       ├── ThumbnailSettings.tsx # Thumbnail settings
│   │       └── ResultPanel.tsx
│   ├── vite.config.ts
│   └── index.html
├── tests/
├── tsup.config.ts
└── package.json
```

## Getting Started

### Install

```bash
npm install
cd client && npm install && cd ..
```

### Development (hot-reload)

```bash
npm run dev
```

This starts:
- Express server on `http://localhost:3099`
- Vite dev server on `http://localhost:5173` (proxies `/api` to Express)

### Production build

```bash
npm run build
npm start
```

Then open `http://localhost:3099` in your browser.

## CLI Usage

```bash
# Convert image to WebP
node dist/index.js convert photo.jpg

# Convert with options
node dist/index.js convert photo.png -o output.webp -q 90

# Resize (width only, auto height)
node dist/index.js resize input.jpg -w 800

# Resize with exact dimensions and fit mode
node dist/index.js resize input.png -w 400 -h 300 --fit cover

# Resize + convert format
node dist/index.js resize photo.jpg -w 200 --format webp -q 85

# Apply effect (requires ImageMagick)
node dist/index.js effects input.jpg -e grayscale
node dist/index.js effects input.jpg -e blur --radius 10 --sigma 5
node dist/index.js effects input.jpg -e sepia --threshold 80

# Generate thumbnail (requires ImageMagick)
node dist/index.js thumbnail input.jpg -s 200 -q 85
```

### CLI Options

#### convert

| Option           | Description                          |
|------------------|--------------------------------------|
| `-o, --output`   | Output file path                     |
| `-f, --format`   | Target format (webp, png, jpeg, ...) |
| `-q, --quality`  | Quality 1–100 (default: 80)          |

#### resize

| Option             | Description                                        |
|--------------------|----------------------------------------------------|
| `-w, --width`      | Target width in pixels                             |
| `-h, --height`     | Target height in pixels                            |
| `--fit`            | Fit mode: cover, contain, fill, inside, outside    |
| `-f, --format`     | Output format (omit to keep source)                |
| `-q, --quality`    | Quality 1–100 (default: 85)                        |
| `--no-enlarge`     | Don't upscale images smaller than the target       |
| `-o, --output`     | Output file path                                   |

#### effects

| Option             | Description                                        |
|--------------------|----------------------------------------------------|
| `-e, --effect`     | Effect name: blur, sharpen, grayscale, sepia, negate, noise, edge, oil-paint, charcoal, implode, swirl, pixelate |
| `--radius`         | Radius for blur, sharpen, edge, oil-paint, charcoal |
| `--sigma`          | Sigma for blur, sharpen                            |
| `--amount`         | Intensity for noise, implode, swirl, pixelate      |
| `--threshold`      | Threshold for sepia (0–100)                        |
| `-o, --output`     | Output file path                                   |

#### thumbnail

| Option           | Description                          |
|------------------|--------------------------------------|
| `-s, --size`     | Thumbnail size in pixels (default: 150) |
| `-q, --quality`  | Quality 1–100 (default: 80)          |
| `-o, --output`   | Output file path                     |

## API Endpoints

| Method | Path                                       | Description              |
|--------|--------------------------------------------|--------------------------|
| POST   | `/api/upload`                              | Upload files (multipart) |
| POST   | `/api/convert`                             | Convert format (sharp)   |
| POST   | `/api/resize`                              | Resize images (sharp)    |
| POST   | `/api/effects`                             | Apply effects (ImageMagick) |
| POST   | `/api/thumbnail`                           | Generate thumbnails (ImageMagick) |
| GET    | `/api/download/:sessionId/:filename`       | Download a single file   |
| GET    | `/api/download-all/:sessionId`             | Download all as ZIP      |
| GET    | `/api/status/:sessionId`                   | Check session status     |

## Architecture

### Engines

The application uses two image processing engines:

1. **[sharp](https://sharp.pixelplumbing.com/)** — High-performance, low-level image processing. Used for convert and resize operations. Fast, efficient, and works without external dependencies.

2. **[ImageMagick](https://imagemagick.org/)** — Swiss Army knife for image processing. Used for effects (blur, sharpen, grayscale, sepia, noise, edge detection, oil paint, charcoal, implode, swirl, pixelate) and thumbnail generation. Provides a wider range of artistic filters and transformation tools.

The engine abstraction is in `src/engines/imagemagick.ts`, which wraps ImageMagick's CLI (`magick`, `convert`, or `gm`) via `child_process`. It auto-detects the installed command and provides typed functions for each operation.

### Extensibility

The application is built on two extensible abstractions:

1. **FormatConverter** — changes a file's encoding format (e.g. PNG → WebP). Registered with a `Processor` and matched by `from`/`to` extension pairs.

   ```
   FormatConverter<WebpOptions> { from: ['jpg','png','gif',...], to: 'webp' }
   ```

2. **ImageOperation** — transforms an image without changing its fundamental type (e.g. resize, effects, thumbnail). Executed directly with typed options.

   ```
   ImageOperation<EffectOpts> { name: 'effects', execute(input, output, options) }
   ```

### Adding a new format converter

Create a file in `src/processors/image/formats/` implementing `FormatConverter`:

```typescript
export class AvifConverter implements FormatConverter {
  name = 'avif'
  from = ['jpg', 'png', 'webp']
  to = 'avif'
  async convert(input: string, output: string, options?: { quality?: number }) {
    // use sharp
  }
}
```

Register it in `src/server.ts`:

```typescript
processor.registerFormat(new AvifConverter())
```

### Adding a new operation

Create a file in `src/operations/image/` implementing `ImageOperation`:

```typescript
export class RotateOperation implements ImageOperation<RotateOptions> {
  name = 'rotate'
  type: MediaType = 'image'
  async execute(input: string, output: string, options: RotateOptions) {
    // use sharp or ImageMagick
  }
}
```

Then add a CLI command (`src/commands/`), an API endpoint (`src/server.ts`), a client API function (`client/src/api.ts`), and a UI component (`client/src/components/`).

### Adding a new media type (e.g. video)

Create a `VideoProcessor` implementing `Processor`, register it in the `processorRegistry`, and add format converters under `src/processors/video/formats/`.

## Use Cases

- **CI/CD pipelines** — Batch-process user uploads to web-friendly formats with `node dist/index.js convert`
- **Thumbnail generation** — Create uniform square thumbnails for galleries, avatars, or previews
- **Photo effects** — Apply artistic filters for social media, marketing, or creative projects
- **Image optimization** — Convert to WebP with quality control for web delivery

## License

MIT
