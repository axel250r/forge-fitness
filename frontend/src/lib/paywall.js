// Free-tier gate for the paid ("sell") build (VITE_MEDIA_MODE=youtube) — self-host and the
// original sideloadable APK stay fully free, this only applies to our own fork's build.
//
// A curated set of exercises (enough to run a full workout end to end — the guided flow,
// rest timer, progression, video demo) stays open with no subscription. Everything else in
// the 1,324-exercise catalogue is visible (so browsing still sells the full library) but
// locked: tapping it shows what a subscription unlocks instead of the exercise itself.
// Chosen to exactly cover the Full Body starter plan (lib/starter.js) plus a few staples
// per body part, so that one plan is a complete, unlocked, real workout on its own.
import { YOUTUBE_MEDIA } from './exercises.js'
import { useStore } from '../store/useStore.js'

// Mirrors S.premium (lib/billing.js, via useStore) into a plain module-level variable so
// isLocked/isFreeExercise/etc. below can stay plain functions — they're called inline all over
// the UI (list .map() callbacks, mostly), not as hooks. A component still needs its own
// `useStore(s => s.premium)` call to actually re-render when a purchase/expiry flips this.
let premium = useStore.getState().premium
useStore.subscribe(s => { premium = s.premium })

export const FREE_EXERCISE_IDS = new Set([
  '0043', // barbell full squat
  '0025', // barbell bench press
  '0027', // barbell bent over row
  '0426', // dumbbell standing overhead press
  '2330', // cable lat pulldown full range of motion
  '0472', // hanging leg raise
  '0652', // pull-up
  '1677', // dumbbell seated bicep curl
  '0241', // cable triceps pushdown (v-bar)
  '0032', // barbell deadlift
  '1459', // dumbbell romanian deadlift
  '1372', // barbell standing calf raise
  '0739', // sled 45° leg press
])

// Only the paid build gates anything — everywhere else every exercise is free, same as upstream.
// An active subscription (premium) unlocks everything, same as if the build weren't gated.
export const isFreeExercise = ex => !YOUTUBE_MEDIA || premium || !!ex.custom || FREE_EXERCISE_IDS.has(ex.id)
export const isLocked = ex => !isFreeExercise(ex)

// Starter plans (lib/starter.js) that stay fully within the free set. Others are previewable
// but locked — loading one shows the paywall instead.
export const FREE_STARTER_PLANS = new Set(['fullBody'])
export const isStarterPlanLocked = key => YOUTUBE_MEDIA && !premium && !FREE_STARTER_PLANS.has(key)

// Quick Sessions (lib/quick-sessions.js) carry their own `free` flag straight from the curated
// list — same gate shape as an exercise, just sourced differently.
export const isQuickSessionLocked = s => YOUTUBE_MEDIA && !premium && !s.free

// For UI that needs the raw flag directly (Settings, the paywall sheet) rather than through one
// of the gates above.
export const isPremium = () => premium
