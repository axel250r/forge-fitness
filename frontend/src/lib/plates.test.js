import { describe, it, expect } from 'vitest'
import { platesFor } from './plates.js'

describe('platesFor', () => {
  it('splits a round number evenly per side', () => {
    const r = platesFor(100, 20, 'kg')   // 80 kg to load, 40 kg/side
    expect(r.perSide).toBe(40)
    expect(r.plates).toEqual([{ plate: 25, count: 1 }, { plate: 15, count: 1 }])
    expect(r.remainder).toBe(0)
  })

  it('greedily uses the largest plates first', () => {
    const r = platesFor(140, 20, 'kg')   // 60 kg/side: 2×25 + 1×10
    expect(r.plates).toEqual([{ plate: 25, count: 2 }, { plate: 10, count: 1 }])
  })

  it('falls back to smaller plates for an odd total, and reports what is left over', () => {
    const r = platesFor(43.75, 20, 'kg')   // 11.875 kg/side: 1×10 + 1×1.25, 0.625 left over
    expect(r.plates).toEqual([{ plate: 10, count: 1 }, { plate: 1.25, count: 1 }])
    expect(r.remainder).toBeCloseTo(0.63, 2)
  })

  it('is empty when the bar alone already meets or beats the target', () => {
    expect(platesFor(20, 20, 'kg').plates).toEqual([])
    expect(platesFor(15, 20, 'kg').plates).toEqual([])
  })

  it('uses the pound plate set for lb', () => {
    const r = platesFor(225, 45, 'lb')   // 90 lb/side
    expect(r.plates).toEqual([{ plate: 45, count: 2 }])
  })
})
