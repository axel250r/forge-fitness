import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { QUICK_SESSIONS, SPECIAL_SESSIONS, QUICK_SESSION_FOCUSES, SPECIAL_SESSION_FOCUSES, SPECIAL_FOCUSES } from './quick-sessions.js'
import { SECTIONS, SECTION_NOTICES, SECTION_OF_FOCUS, PRENATAL_SHORT } from './extra-exercises.js'

const all = [...QUICK_SESSIONS, ...SPECIAL_SESSIONS]

describe('Quick sessions', () => {
  it('every session has a video, a unique id and a sensible length', () => {
    all.forEach(s => {
      expect(s.videoId).toMatch(/^[\w-]{11}$/)
      expect(s.minutes).toBeGreaterThan(0)
    })
    expect(new Set(all.map(s => s.id)).size).toBe(all.length)
    expect(new Set(all.map(s => s.videoId)).size).toBe(all.length)
  })

  it('keep the regular and the specialized sessions apart', () => {
    expect(QUICK_SESSIONS.length).toBeGreaterThan(40)
    QUICK_SESSIONS.forEach(s => expect(SPECIAL_FOCUSES).not.toContain(s.focus))
    SPECIAL_SESSIONS.forEach(s => expect(SPECIAL_FOCUSES).toContain(s.focus))
  })

  it('offer every specialized focus, in the same order as the Library sections', () => {
    expect(SPECIAL_SESSION_FOCUSES).toEqual(SPECIAL_FOCUSES)
    expect(SPECIAL_FOCUSES.map(f => SECTION_OF_FOCUS[f])).toEqual(SECTIONS.map(s => s.key))
    SPECIAL_FOCUSES.forEach(f => expect(SPECIAL_SESSIONS.filter(s => s.focus === f).length).toBeGreaterThanOrEqual(3))
  })

  it('list the regular filter chips in a fixed order with nothing left out', () => {
    expect(QUICK_SESSION_FOCUSES).toEqual(['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Cardio', 'Mobility'])
    expect(new Set(QUICK_SESSIONS.map(s => s.focus))).toEqual(new Set(QUICK_SESSION_FOCUSES))
  })

  it('give free users exactly one taste of each specialized focus', () => {
    SPECIAL_FOCUSES.forEach(f => expect(SPECIAL_SESSIONS.filter(s => s.focus === f && s.free).length).toBe(1))
  })

  it('give every section a safety notice, and translate it into every language', async () => {
    const dir = new URL('../locales/', import.meta.url)
    const files = readdirSync(dir).filter(f => f.endsWith('.js'))
    expect(files.length).toBeGreaterThanOrEqual(11)
    for (const f of files) {
      const { default: dict } = await import(/* @vite-ignore */ new URL(f, dir).href)
      const need = [
        ...SECTIONS.map(s => s.label), ...SPECIAL_FOCUSES,
        ...Object.values(SECTION_NOTICES).map(n => n.text), PRENATAL_SHORT,
        'Specialized sessions', '{0} follow-along videos', '{0} videos: isometric, pelvic floor and pregnancy',
      ]
      need.forEach(k => expect(dict[k], f + ': ' + k.slice(0, 40)).toBeTruthy())
    }
    expect(Object.keys(SECTION_NOTICES).sort()).toEqual(SECTIONS.map(s => s.key).sort())
  })
})
