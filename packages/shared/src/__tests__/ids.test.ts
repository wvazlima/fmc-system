import { describe, expect, it } from 'vitest'
import { isUuidV7 } from '../ids.js'

describe('isUuidV7', () => {
  it('aceita um UUID v7', () => {
    expect(isUuidV7('0194b8c0-1234-7abc-8def-0123456789ab')).toBe(true)
  })

  it('rejeita um UUID v4 — o projeto exige v7 (ADR-0009)', () => {
    expect(isUuidV7('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(false)
  })

  it('rejeita texto que não é UUID', () => {
    expect(isUuidV7('lote-agosto')).toBe(false)
  })
})
