import QUICK_SESSION_VIDEOS from './quick-sessions.json'

// Curated "Quick Session" follow-along workouts for people short on time — one YouTube video
// is the whole workout, no per-exercise setup or logging. Resolved offline by
// scripts/match-quick-sessions.mjs (a tiny, one-shot YouTube Data API lookup — small enough to
// finish in a single run, unlike the exercise matcher which needs days). All equipment-free or
// close to it (a couple of water bottles cover the one dumbbell session), matching an audience
// training at home with whatever's around.
// `focus` and the first three (free tier) are plain data — the UI translates/gates them.
const SESSIONS = [
  { id: 'full-body-20', focus: 'Full Body', minutes: 20, free: true },
  { id: 'cardio-hiit-20', focus: 'Cardio', minutes: 15, free: true },
  { id: 'mobility-10', focus: 'Mobility', minutes: 10, free: true },
  { id: 'abs-core-15', focus: 'Core', minutes: 15, free: false },
  { id: 'upper-body-25', focus: 'Upper Body', minutes: 15, free: false },
  { id: 'lower-body-20', focus: 'Lower Body', minutes: 20, free: false },
  { id: 'full-body-30', focus: 'Full Body', minutes: 30, free: false },
  { id: 'low-impact-cardio-30', focus: 'Cardio', minutes: 30, free: false },
  { id: 'back-shoulders-20', focus: 'Upper Body', minutes: 20, free: false },
  { id: 'glutes-15', focus: 'Lower Body', minutes: 15, free: false },
  { id: 'chest-triceps-20', focus: 'Upper Body', minutes: 10, free: false },
  { id: 'full-body-beginner-15', focus: 'Full Body', minutes: 15, free: false },
  { id: 'bedtime-stretch-10', focus: 'Mobility', minutes: 10, free: false },
  { id: 'plyo-cardio-20', focus: 'Cardio', minutes: 20, free: false },
  { id: 'pilates-core-20', focus: 'Core', minutes: 20, free: false },
  { id: 'dumbbell-full-body-30', focus: 'Full Body', minutes: 30, free: false },
  { id: 'core-standing-10', focus: 'Core', minutes: 10, free: false },
  { id: 'obliques-15', focus: 'Core', minutes: 15, free: false },
  { id: 'core-beginner-10', focus: 'Core', minutes: 10, free: false },
  { id: 'dance-cardio-25', focus: 'Cardio', minutes: 25, free: false },
  { id: 'kickboxing-cardio-20', focus: 'Cardio', minutes: 20, free: false },
  { id: 'hip-mobility-10', focus: 'Mobility', minutes: 10, free: false },
  { id: 'morning-stretch-10', focus: 'Mobility', minutes: 10, free: false },
  { id: 'arms-15', focus: 'Upper Body', minutes: 15, free: false },
  { id: 'shoulders-10', focus: 'Upper Body', minutes: 10, free: false },
  { id: 'legs-burn-20', focus: 'Lower Body', minutes: 20, free: false },
  { id: 'inner-thigh-15', focus: 'Lower Body', minutes: 15, free: false },
  { id: 'full-body-hiit-25', focus: 'Full Body', minutes: 25, free: false },
  { id: 'full-body-tabata-15', focus: 'Full Body', minutes: 15, free: false },
  { id: 'full-body-warmup-10', focus: 'Full Body', minutes: 10, free: false },
  { id: 'full-body-athletic-20', focus: 'Full Body', minutes: 20, free: false },
  { id: 'full-body-express-10', focus: 'Full Body', minutes: 10, free: false },
  { id: 'cardio-boxing-15', focus: 'Cardio', minutes: 15, free: false },
  { id: 'cardio-walk-20', focus: 'Cardio', minutes: 20, free: false },
  { id: 'cardio-tabata-15', focus: 'Cardio', minutes: 15, free: false },
  { id: 'cardio-beginner-15', focus: 'Cardio', minutes: 15, free: false },
  { id: 'cardio-fatburn-30', focus: 'Cardio', minutes: 30, free: false },
  { id: 'shoulder-mobility-10', focus: 'Mobility', minutes: 10, free: false },
  { id: 'ankle-mobility-10', focus: 'Mobility', minutes: 10, free: false },
  { id: 'full-body-stretch-15', focus: 'Mobility', minutes: 15, free: false },
  { id: 'yoga-flow-20', focus: 'Mobility', minutes: 20, free: false },
  { id: 'core-tabata-15', focus: 'Core', minutes: 15, free: false },
  { id: 'lower-abs-10', focus: 'Core', minutes: 10, free: false },
  { id: 'plank-workout-10', focus: 'Core', minutes: 10, free: false },
  { id: 'core-flat-stomach-15', focus: 'Core', minutes: 15, free: false },
  { id: 'back-workout-15', focus: 'Upper Body', minutes: 15, free: false },
  { id: 'chest-workout-15', focus: 'Upper Body', minutes: 15, free: false },
  { id: 'push-workout-20', focus: 'Upper Body', minutes: 20, free: false },
  { id: 'glutes-activation-10', focus: 'Lower Body', minutes: 10, free: false },
  { id: 'quads-15', focus: 'Lower Body', minutes: 15, free: false },
  { id: 'calves-10', focus: 'Lower Body', minutes: 10, free: false },
  { id: 'lower-body-burn-25', focus: 'Lower Body', minutes: 25, free: false },
  // Specialized sessions: the same follow-along format for VigorUp's own library sections
  // (lib/extra-exercises.js). They get their own screen so they don't get lost among the
  // short workouts. One free taste of each, like the exercise library.
  { id: 'iso-full-15', focus: 'Isometric', minutes: 15, free: true },
  { id: 'iso-no-repeat-15', focus: 'Isometric', minutes: 15, free: false },
  { id: 'iso-core-10', focus: 'Isometric', minutes: 10, free: false },
  { id: 'iso-wall-sit-10', focus: 'Isometric', minutes: 10, free: false },
  { id: 'pf-beginner-10', focus: 'Pelvic floor', minutes: 10, free: true },
  { id: 'pf-release-10', focus: 'Pelvic floor', minutes: 10, free: false },
  { id: 'pf-deep-core-10', focus: 'Pelvic floor', minutes: 10, free: false },
  { id: 'pf-abs-10', focus: 'Pelvic floor', minutes: 10, free: false },
  { id: 'prenatal-all-15', focus: 'Pregnancy', minutes: 15, free: true },
  { id: 'prenatal-yoga-15', focus: 'Pregnancy', minutes: 15, free: false },
  { id: 'prenatal-pilates-10', focus: 'Pregnancy', minutes: 10, free: false },
  { id: 'prenatal-stretch-15', focus: 'Pregnancy', minutes: 15, free: false },
  { id: 'prenatal-full-30', focus: 'Pregnancy', minutes: 30, free: false },
  { id: 'prenatal-sciatica-30', focus: 'Pregnancy', minutes: 30, free: false },
]

// The specialized focuses are the Library sections of the same name (lib/extra-exercises.js
// SECTIONS), in the order they appear there.
export const SPECIAL_FOCUSES = ['Isometric', 'Pelvic floor', 'Pregnancy']

// Merge in the resolved video — and drop anything the script hasn't resolved yet, rather than
// show a card with nowhere to go.
const RESOLVED = SESSIONS
  .map(s => ({ ...s, ...QUICK_SESSION_VIDEOS[s.id] }))
  .filter(s => s.videoId)

// "Short on time" is the regular workouts; the specialized ones live on their own screen.
export const QUICK_SESSIONS = RESOLVED.filter(s => !SPECIAL_FOCUSES.includes(s.focus))
export const SPECIAL_SESSIONS = RESOLVED.filter(s => SPECIAL_FOCUSES.includes(s.focus))

// Filter chips in a fixed, readable order (whole body first, then regions, then style) rather
// than whatever order the list happens to introduce them in; only those that have a session.
const FOCUS_ORDER = ['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Cardio', 'Mobility']
export const QUICK_SESSION_FOCUSES = FOCUS_ORDER.filter(f => QUICK_SESSIONS.some(s => s.focus === f))
export const SPECIAL_SESSION_FOCUSES = SPECIAL_FOCUSES.filter(f => SPECIAL_SESSIONS.some(s => s.focus === f))

export const quickSessionUrl = s => `https://www.youtube.com/watch?v=${s.videoId}`
export const quickSessionThumb = s => `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`
