import path from 'node:path'
import type { Processor, MediaType, FormatConverter, ConvertResult, ConvertOptions } from '../../types'

export class ImageProcessor implements Processor {
  readonly type: MediaType = 'image'
  private converters: FormatConverter[] = []

  registerFormat(converter: FormatConverter): void {
    this.converters.push(converter)
  }

  async convert(input: string, targetFormat: string, output?: string, options?: ConvertOptions): Promise<ConvertResult> {
    const ext = path.extname(input).toLowerCase().replace('.', '')
    const converter = this.converters.find(
      (c) => c.from.includes(ext) && c.to === targetFormat,
    )

    if (!converter) {
      return {
        success: false,
        inputPath: input,
        outputPath: output ?? '',
        error: `No converter found for .${ext} -> ${targetFormat}`,
      }
    }

    const resolvedOutput = output ?? this.defaultOutput(input, targetFormat)
    return converter.convert(input, resolvedOutput, options)
  }

  private defaultOutput(input: string, format: string): string {
    const parsed = path.parse(input)
    return path.join(parsed.dir, `${parsed.name}.${format}`)
  }
}
