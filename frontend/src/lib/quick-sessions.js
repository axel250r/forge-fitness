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
  { id: 'abs-core-15', focus: 'Abs', minutes: 15, free: false },
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
  { id: 'pilates-core-20', focus: 'Abs', minutes: 20, free: false },
  { id: 'dumbbell-full-body-30', focus: 'Full Body', minutes: 30, free: false },
]

// Merge in the resolved video — and drop anything the script hasn't resolved yet, rather than
// show a card with nowhere to go.
export const QUICK_SESSIONS = SESSIONS
  .map(s => ({ ...s, ...QUICK_SESSION_VIDEOS[s.id] }))
  .filter(s => s.videoId)

export const quickSessionUrl = s => `https://www.youtube.com/watch?v=${s.videoId}`
export const quickSessionThumb = s => `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`
