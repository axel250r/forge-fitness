// Starter plans — a ready-made week for whoever opens the app with an empty plan and
// doesn't want to build one from scratch first. Every plan defaults to linear progression
// (no `prog` set on the routine — see policyFor() in progression.js), so weights already
// climb session to session without any setup.
import { uid } from './format.js'

const build = spec => spec.map(([name, emoji, list]) =>
  ({ id: uid(), name, emoji, ex: list.map(([id, sets, reps]) => ({ id, sets, reps, weight: 0 })) }))

const PPL = [
  ['Push Day', 'barbell', [['0025', 4, 8], ['0047', 3, 10], ['0426', 3, 10], ['0334', 3, 12], ['0241', 3, 12], ['0251', 3, 10]]],
  ['Pull Day', 'pullup', [['2330', 4, 10], ['0027', 4, 8], ['1323', 3, 10], ['0031', 3, 10], ['0313', 3, 12]]],
  ['Leg Day', 'legs', [['0043', 4, 8], ['0085', 3, 10], ['0739', 3, 12], ['0585', 3, 12], ['0586', 3, 12], ['0605', 4, 15]]]
]

const UPPER_LOWER = [
  ['Upper Body', 'barbell', [['0025', 4, 8], ['2330', 4, 8], ['0426', 3, 10], ['0027', 3, 10], ['0241', 3, 12], ['1677', 3, 12]]],
  ['Lower Body', 'legs', [['0043', 4, 8], ['0085', 3, 10], ['0739', 3, 12], ['0586', 3, 12], ['1372', 4, 15], ['0472', 3, 12]]]
]

const FULL_BODY = [
  ['Full Body', 'barbell', [['0043', 3, 8], ['0025', 3, 8], ['0027', 3, 8], ['0426', 3, 10], ['2330', 3, 10], ['0472', 3, 12]]]
]

const FIVE_BY_FIVE = [
  ['Workout A', 'barbell', [['0043', 5, 5], ['0025', 5, 5], ['0027', 5, 5]]],
  ['Workout B', 'barbell', [['0043', 5, 5], ['0091', 5, 5], ['0032', 1, 5]]]
]

// Bodyweight + dumbbell only — no bar, cable, or machine, so it fits the "At home" filter
// (lib/exercises.js isHomeFriendly) exactly. One push, one squat, one pull, one press, one
// glute/hip hinge, one core move: the same full-body template as FULL_BODY above.
const HOME_FULL_BODY = [
  ['Full Body (Home)', 'dumbbell', [['0662', 3, 12], ['1760', 3, 12], ['0293', 3, 10], ['0426', 3, 10], ['3561', 3, 15], ['0274', 3, 15]]]
]

export const STARTER_PLANS = {
  ppl: {
    label: 'Push / Pull / Legs',
    subtitle: '3x/week · Mon Push · Wed Pull · Fri Legs',
    build() {
      const [push, pull, legs] = build(PPL)
      return { routines: [push, pull, legs], week: { 1: push.id, 3: pull.id, 5: legs.id } }
    }
  },
  upperLower: {
    label: 'Upper / Lower',
    subtitle: '4x/week · Mon+Thu Upper · Tue+Fri Lower',
    build() {
      const [upper, lower] = build(UPPER_LOWER)
      return { routines: [upper, lower], week: { 1: upper.id, 2: lower.id, 4: upper.id, 5: lower.id } }
    }
  },
  fullBody: {
    label: 'Full Body',
    subtitle: '3x/week · Mon · Wed · Fri',
    build() {
      const [full] = build(FULL_BODY)
      return { routines: [full], week: { 1: full.id, 3: full.id, 5: full.id } }
    }
  },
  fiveByFive: {
    label: '5×5 Strength',
    subtitle: '3x/week · alternating A/B · Mon A · Wed B · Fri A',
    build() {
      const [a, b] = build(FIVE_BY_FIVE)
      return { routines: [a, b], week: { 1: a.id, 3: b.id, 5: a.id } }
    }
  },
  home: {
    label: 'At home', // same key as the Library Gym/At home toggle — one translation, reused
    subtitle: '3x/week · bodyweight + dumbbells · Mon · Wed · Fri',
    build() {
      const [full] = build(HOME_FULL_BODY)
      return { routines: [full], week: { 1: full.id, 3: full.id, 5: full.id } }
    }
  }
}

// Kept for the demo build, which seeds a history on top of exactly the PPL routines.
export const starterRoutines = () => build(PPL)
