// Perpetual free Premium for a handful of people (family, close friends) who shouldn't have to
// pay or deal with anything more complex than typing a short code once — no server, no account.
// Redeeming sets S.giftPremium (see useStore.js), which combines with real Play Billing status
// into the single `premium` flag everything else reads.
//
// The code values are NOT in this file (or anywhere in the repo): they come from the
// VITE_GIFT_CODES build-time variable, set in a gitignored .env.local on the machine that runs
// `npm run build:sell`. So the public source shows only the mechanism — a build with no
// .env.local simply has no gift codes, which is the right default. Treat a code as a credential
// (same category as the signing key), not as source: hand each one out privately, and keep a
// note of who got which.
//
// Still a shared secret, not authentication: whoever types a valid code gets Premium on that
// device. Fine for gifting to trusted people; it is not an access-control system.
const CODES = new Set(
  (import.meta.env.VITE_GIFT_CODES || '')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean)
)

// Case/whitespace-insensitive so it doesn't matter how someone reads the code out over the
// phone or how autocapitalize mangled it.
const normalize = code => (code || '').trim().toUpperCase()

export const isValidGiftCode = code => CODES.size > 0 && CODES.has(normalize(code))
