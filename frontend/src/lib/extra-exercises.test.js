import { describe, it, expect } from 'vitest'
import { EXDB, EXIDX, BODYPARTS, isHold } from './exercises.js'
import { EXTRA_EXERCISES, SECTIONS, exSections, PRENATAL_NOTICE, PRENATAL_SHORT } from './extra-exercises.js'
import { EXDB as UPSTREAM } from './exercises-data.js'
import { modeOf, defaultConfig } from './history.js'
import es from '../locales/es.js'

describe('VigorUp-written exercises', () => {
  it('have unique ids that never collide with the upstream dataset', () => {
    const ids = EXTRA_EXERCISES.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    const upstream = new Set(UPSTREAM.map(e => e.id))
    ids.forEach(id => { expect(id.startsWith('x')).toBe(true); expect(upstream.has(id)).toBe(false) })
  })

  it('are merged into the catalogue and the id index', () => {
    expect(EXDB.length).toBe(UPSTREAM.length + EXTRA_EXERCISES.length)
    EXTRA_EXERCISES.forEach(e => expect(EXIDX[e.id]).toBe(e))
  })

  it('have English steps, an equally long Spanish translation, and a known body part', () => {
    const known = new Set(UPSTREAM.map(e => e.bp))
    EXTRA_EXERCISES.forEach(e => {
      expect(e.n.length).toBeGreaterThan(2)
      expect(e.st.length).toBeGreaterThanOrEqual(3)
      expect(e.i18n.es.st.length).toBe(e.st.length)
      expect(known.has(e.bp)).toBe(true)
      expect((e.secs || []).every(s => SECTIONS.some(x => x.key === s))).toBe(true)
      if (e.desc) expect(e.i18n.es.desc).toBeTruthy()
    })
    expect(BODYPARTS).toEqual([...new Set(EXDB.map(e => e.bp))].sort())
  })

  it('give every section something to show, including the upstream exercises it borrows', () => {
    SECTIONS.forEach(s => expect(EXDB.filter(e => exSections(e).includes(s.key)).length).toBeGreaterThan(5))
    const tagged = ['3544', '3665', '3419', '2135', '1297', '0500', '0705', '1364']
    tagged.forEach(id => { expect(EXIDX[id]).toBeTruthy(); expect(exSections(EXIDX[id]).length).toBeGreaterThan(0) })
  })

  it('start static holds in Time mode with their own duration', () => {
    const plank = EXIDX.x101
    expect(isHold(plank)).toBe(true)
    expect(modeOf({ id: 'x101' })).toBe('time')
    expect(defaultConfig('x101')).toMatchObject({ mode: 'time', sec: 30, sets: 3 })
    // a hold can still be logged by reps if the user switches the mode by hand
    expect(defaultConfig('x101', 'reps').mode).toBe('reps')
  })

  it('leave every upstream exercise exactly as it was', () => {
    const squat = UPSTREAM.find(e => e.n === 'barbell full squat').id
    expect(modeOf({ id: squat })).toBe('reps')
    expect(defaultConfig(squat)).toMatchObject({ sets: 3, reps: 10, weight: 0, mode: 'reps' })
    const cardio = UPSTREAM.find(e => e.bp === 'cardio').id
    expect(defaultConfig(cardio)).toEqual({ sets: 1, min: 20, speed: 8 })
  })

  it('carry their own starting point where reps or speed matter', () => {
    expect(defaultConfig('x201')).toMatchObject({ sets: 3, reps: 10, mode: 'reps' })
    expect(defaultConfig('x314')).toEqual({ sets: 1, min: 20, speed: 4 })
  })

  it('have the section labels and the pregnancy notice translated into Spanish', () => {
    SECTIONS.forEach(s => expect(es[s.label]).toBeTruthy())
    expect(es[PRENATAL_NOTICE]).toBeTruthy()
    expect(es[PRENATAL_SHORT]).toBeTruthy()
    expect(PRENATAL_NOTICE).toMatch(/not responsible/)
    expect(es[PRENATAL_NOTICE]).toMatch(/no se hace responsable/)
  })
})
