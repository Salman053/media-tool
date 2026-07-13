import { describe, it, expect } from 'vitest'
import { EFFECT_LIST } from '../src/operations/image/effects'
import { ResizeOperation } from '../src/operations/image/resize'
import { EffectsOperation } from '../src/operations/image/effects'
import { ThumbnailOperation } from '../src/operations/image/thumbnail'
import { VideoConvertOperation } from '../src/operations/video/convert'
import { FrameExtractOperation } from '../src/operations/video/frames'

describe('EFFECT_LIST', () => {
  it('has 12 effects', () => {
    expect(EFFECT_LIST).toHaveLength(12)
  })

  it('each effect has id, label, description', () => {
    for (const ef of EFFECT_LIST) {
      expect(ef.id).toBeTruthy()
      expect(ef.label).toBeTruthy()
      expect(ef.description).toBeTruthy()
    }
  })

  it('all ids are unique', () => {
    const ids = EFFECT_LIST.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes all expected effects', () => {
    const expected = ['blur', 'sharpen', 'grayscale', 'sepia', 'negate', 'noise', 'edge', 'oil-paint', 'charcoal', 'implode', 'swirl', 'pixelate']
    const ids = EFFECT_LIST.map((e) => e.id)
    for (const id of expected) {
      expect(ids).toContain(id)
    }
  })
})

describe('operation types', () => {
  it('ResizeOperation has name resize and type image', () => {
    const op = new ResizeOperation()
    expect(op.name).toBe('resize')
    expect(op.type).toBe('image')
  })

  it('EffectsOperation has name effects and type image', () => {
    const op = new EffectsOperation()
    expect(op.name).toBe('effects')
    expect(op.type).toBe('image')
  })

  it('ThumbnailOperation has name thumbnail and type image', () => {
    const op = new ThumbnailOperation()
    expect(op.name).toBe('thumbnail')
    expect(op.type).toBe('image')
  })

  it('VideoConvertOperation has name video-convert and type video', () => {
    const op = new VideoConvertOperation()
    expect(op.name).toBe('video-convert')
    expect(op.type).toBe('video')
  })

  it('FrameExtractOperation has name video-frames and type video', () => {
    const op = new FrameExtractOperation()
    expect(op.name).toBe('video-frames')
    expect(op.type).toBe('video')
  })

  it('all operations implement execute method', () => {
    const ops = [new ResizeOperation(), new EffectsOperation(), new ThumbnailOperation(), new VideoConvertOperation(), new FrameExtractOperation()]
    for (const op of ops) {
      expect(typeof op.execute).toBe('function')
    }
  })
})
