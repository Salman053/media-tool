import { describe, it, expect } from 'vitest'
import { parseArgs } from '../src/commands/convert'

describe('parseArgs', () => {
  it('parses input file', () => {
    const result = parseArgs(['photo.jpg'])
    expect(result.input).toBe('photo.jpg')
  })

  it('parses output flag', () => {
    const result = parseArgs(['photo.jpg', '-o', 'out.webp'])
    expect(result.input).toBe('photo.jpg')
    expect(result.output).toBe('out.webp')
  })

  it('parses long output flag', () => {
    const result = parseArgs(['photo.jpg', '--output', 'out.webp'])
    expect(result.output).toBe('out.webp')
  })

  it('parses quality flag', () => {
    const result = parseArgs(['photo.jpg', '-q', '90'])
    expect(result.quality).toBe(90)
  })

  it('parses format flag', () => {
    const result = parseArgs(['photo.jpg', '-f', 'png'])
    expect(result.format).toBe('png')
  })
})
