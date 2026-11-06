import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { EXTRA_EXERCISES } from './extra-exercises.js'
import { LANGS } from './i18n.js'

// Every UI language except English (the source) and Spanish (inline in extra-exercises.js) must
// carry a full translation of VigorUp's own exercises: same exercises, same number of steps, and
// every health note (desc) translated — a missing note would silently show the English one.
const dir = join(__dirname, '..', 'extra-i18n')
const files = readdirSync(dir).filter(f => f.endsWith('.js'))
const expected = Object.keys(LANGS).filter(l => l !== 'en' && l !== 'es').sort()

describe('extra-i18n packs', () => {
  it('exist for every UI language except English and Spanish', () => {
    expect(files.map(f => f.replace('.js', '')).sort()).toEqual(expected)
  })

  for (const lang of expected) {
    it(`${lang}: covers all exercises with matching steps and notes`, async () => {
      const pack = (await import(`../extra-i18n/${lang}.js`)).default
      expect(Object.keys(pack).sort()).toEqual(EXTRA_EXERCISES.map(e => e.id).sort())
      for (const ex of EXTRA_EXERCISES) {
        const tr = pack[ex.id]
        expect(tr.st.length, `${lang} ${ex.id} steps`).toBe(ex.st.length)
        for (const s of tr.st) expect(s.trim().length, `${lang} ${ex.id} empty step`).toBeGreaterThan(0)
        expect(!!tr.desc, `${lang} ${ex.id} desc`).toBe(!!ex.desc)
      }
    })
  }
})
