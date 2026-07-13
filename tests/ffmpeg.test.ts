import { describe, it, expect } from 'vitest'
import { evalFps } from '../src/engines/ffmpeg'

describe('evalFps', () => {
  it('parses "30000/1001" as 30', () => {
    expect(evalFps('30000/1001')).toBe(30)
  })
  it('parses "24000/1001" as 24', () => {
    expect(evalFps('24000/1001')).toBe(24)
  })
  it('parses "25/1" as 25', () => {
    expect(evalFps('25/1')).toBe(25)
  })
  it('parses "50/1" as 50', () => {
    expect(evalFps('50/1')).toBe(50)
  })
  it('parses simple integer string "30"', () => {
    expect(evalFps('30')).toBe(30)
  })
  it('handles undefined', () => {
    expect(evalFps(undefined)).toBe(0)
  })
  it('handles empty string', () => {
    expect(evalFps('')).toBe(0)
  })
  it('handles malformed string', () => {
    expect(evalFps('abc/def')).toBe(0)
  })
})
