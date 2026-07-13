import { describe, it, expect } from 'vitest'
import { applyPattern } from '../src/commands/rename'
import type { RenameRule } from '../src/commands/rename'

describe('applyPattern', () => {
  const opts: RenameRule = { pattern: '' }

  it('replaces {n} with zero-padded number', () => {
    expect(applyPattern('photo.jpg', 'img-{n}.jpg', 0, { ...opts, start: 1, padding: 3 })).toBe('img-001.jpg')
  })

  it('replaces {n} incrementing', () => {
    expect(applyPattern('photo.jpg', 'img-{n}.jpg', 5, { ...opts, start: 1, padding: 3 })).toBe('img-006.jpg')
  })

  it('replaces {i} with non-padded number', () => {
    expect(applyPattern('photo.jpg', 'img-{i}.jpg', 0, { ...opts, start: 1 })).toBe('img-1.jpg')
  })

  it('replaces {original} with base name', () => {
    expect(applyPattern('my-photo.jpg', '{original}-resized{ext}', 0, opts)).toBe('my-photo-resized.jpg')
  })

  it('replaces {ext} with extension', () => {
    expect(applyPattern('file.png', 'copy{ext}', 0, opts)).toBe('copy.png')
  })

  it('handles multiple placeholders', () => {
    expect(applyPattern('vacation.jpg', 'img-{n}-vacation{ext}', 0, { ...opts, start: 1, padding: 2 })).toBe('img-01-vacation.jpg')
  })

  it('start defaults to 1', () => {
    expect(applyPattern('a.txt', '{n}.txt', 0, { ...opts, padding: 2 })).toBe('01.txt')
  })

  it('padding defaults to 1', () => {
    expect(applyPattern('a.txt', '{n}.txt', 0, { ...opts, start: 5 })).toBe('5.txt')
  })

  it('handles no placeholders (plain string)', () => {
    expect(applyPattern('ignored.png', 'output.png', 0, opts)).toBe('output.png')
  })
})
