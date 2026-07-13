import { describe, it, expect } from 'vitest'
import { parseArgs } from '../src/commands/convert'
import { parseResizeArgs } from '../src/commands/resize'
import { parseEffectsArgs } from '../src/commands/effects'
import { parseThumbnailArgs } from '../src/commands/thumbnail'

describe('convert parseArgs', () => {
  it('parses input file', () => {
    expect(parseArgs(['photo.jpg']).input).toBe('photo.jpg')
  })
  it('parses -o output', () => {
    const r = parseArgs(['photo.jpg', '-o', 'out.webp'])
    expect(r.input).toBe('photo.jpg')
    expect(r.output).toBe('out.webp')
  })
  it('parses --output', () => {
    expect(parseArgs(['photo.jpg', '--output', 'out.webp']).output).toBe('out.webp')
  })
  it('parses -q quality', () => {
    expect(parseArgs(['photo.jpg', '-q', '90']).quality).toBe(90)
  })
  it('parses -f format', () => {
    expect(parseArgs(['photo.jpg', '-f', 'png']).format).toBe('png')
  })
  it('no args returns empty input', () => {
    expect(parseArgs([]).input).toBe('')
  })
})

describe('resize parseResizeArgs', () => {
  it('parses input file', () => {
    expect(parseResizeArgs(['input.png']).input).toBe('input.png')
  })
  it('parses -w width', () => {
    expect(parseResizeArgs(['input.png', '-w', '800']).width).toBe(800)
  })
  it('parses -h height', () => {
    expect(parseResizeArgs(['input.png', '-h', '600']).height).toBe(600)
  })
  it('parses --fit', () => {
    expect(parseResizeArgs(['input.png', '--fit', 'contain']).fit).toBe('contain')
  })
  it('parses -f format', () => {
    expect(parseResizeArgs(['input.png', '-f', 'webp']).format).toBe('webp')
  })
  it('parses -q quality', () => {
    expect(parseResizeArgs(['input.png', '-q', '85']).quality).toBe(85)
  })
  it('parses --no-enlarge', () => {
    expect(parseResizeArgs(['input.png', '--no-enlarge']).noEnlarge).toBe(true)
  })
  it('parses -o output', () => {
    expect(parseResizeArgs(['input.png', '-o', 'out.jpg']).output).toBe('out.jpg')
  })
  it('parses all options together', () => {
    const r = parseResizeArgs(['in.jpg', '-w', '400', '-h', '300', '--fit', 'cover', '-f', 'webp', '-q', '90', '-o', 'out.webp'])
    expect(r.input).toBe('in.jpg')
    expect(r.width).toBe(400)
    expect(r.height).toBe(300)
    expect(r.fit).toBe('cover')
    expect(r.format).toBe('webp')
    expect(r.quality).toBe(90)
    expect(r.output).toBe('out.webp')
  })
})

describe('effects parseEffectsArgs', () => {
  it('parses input and effect', () => {
    const r = parseEffectsArgs(['input.jpg', '-e', 'grayscale'])
    expect(r.input).toBe('input.jpg')
    expect(r.effect).toBe('grayscale')
  })
  it('parses --effect long flag', () => {
    expect(parseEffectsArgs(['input.jpg', '--effect', 'sepia']).effect).toBe('sepia')
  })
  it('parses --radius and --sigma', () => {
    const r = parseEffectsArgs(['input.jpg', '-e', 'blur', '--radius', '10', '--sigma', '5'])
    expect(r.radius).toBe(10)
    expect(r.sigma).toBe(5)
  })
  it('parses --amount', () => {
    expect(parseEffectsArgs(['input.jpg', '-e', 'implode', '--amount', '70']).amount).toBe(70)
  })
  it('parses --threshold', () => {
    expect(parseEffectsArgs(['input.jpg', '-e', 'sepia', '--threshold', '80']).threshold).toBe(80)
  })
  it('parses -o output', () => {
    expect(parseEffectsArgs(['input.jpg', '-e', 'negate', '-o', 'out.jpg']).output).toBe('out.jpg')
  })
  it('no effect defaults to empty string', () => {
    expect(parseEffectsArgs(['input.jpg']).effect).toBe('')
  })
})

describe('thumbnail parseThumbnailArgs', () => {
  it('parses input file', () => {
    expect(parseThumbnailArgs(['input.jpg']).input).toBe('input.jpg')
  })
  it('parses -s size', () => {
    expect(parseThumbnailArgs(['input.jpg', '-s', '200']).size).toBe(200)
  })
  it('parses --size', () => {
    expect(parseThumbnailArgs(['input.jpg', '--size', '300']).size).toBe(300)
  })
  it('parses -q quality', () => {
    expect(parseThumbnailArgs(['input.jpg', '-q', '85']).quality).toBe(85)
  })
  it('default size is 150', () => {
    expect(parseThumbnailArgs(['input.jpg']).size).toBe(150)
  })
  it('parses -o output', () => {
    expect(parseThumbnailArgs(['input.jpg', '-o', 'thumb.jpg']).output).toBe('thumb.jpg')
  })
})
