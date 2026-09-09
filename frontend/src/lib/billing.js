// Google Play Billing (Loadout Premium, $3/mo) via cordova-plugin-purchase, which wraps the
// native Play Billing Library.
//
// Verification is device-only, on purpose: Play's billing service is already the source of
// truth for whether a purchase happened, and this app runs no server to re-check receipts
// against — same "everything stays on your phone" design as the rest of it (see Settings'
// "no account, no cloud" copy). The tradeoff: a rooted/tampered device could in theory spoof
// an owned subscription locally. Accepted risk for a $3/mo fitness app with no resale value —
// revisit if that ever changes (e.g. add a validator via store.validator, ideally with a
// lightweight server, if piracy becomes an actual problem).
export const PRODUCT_ID = 'loadout_premium_monthly'
export const PACKAGE_ID = 'com.loadoutfit.app'

// The plugin only exists in the native Capacitor/Android build (window.CdvPurchase is never
// defined in the browser or the self-hosted web build) — every export here is a safe no-op
// outside that build instead of throwing.
const AVAILABLE = typeof window !== 'undefined' && !!window.CdvPurchase

let owned = false
let ready = false

function refreshOwned(onChange) {
  const { store } = window.CdvPurchase
  const next = !!store.get(PRODUCT_ID)?.owned
  if (next === owned) return
  owned = next
  onChange(owned)
}

// Call once at boot. `onChange(owned)` fires every time subscription status changes (purchase,
// restore, renewal, cancellation/expiry) — the caller (useStore) mirrors it into store state so
// isLocked/isFreeExercise (lib/paywall.js) and the UI react to it.
// Returns a promise so boot() can wait for the initial owned-state query — otherwise the app
// would render with `premium` at its default `false` for however long that query takes, flashing
// the Premium paywall on content an already-subscribed person already unlocked.
export function initBilling(onChange) {
  if (!AVAILABLE) return Promise.resolve()
  const { store, ProductType, Platform } = window.CdvPurchase

  store.register({ id: PRODUCT_ID, type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY })

  store.when()
    // Play Billing itself already confirmed the payment by the time a transaction reaches
    // "approved" — finish() closes it out immediately rather than calling verify() against a
    // validation server we don't run.
    .approved(transaction => transaction.finish())
    .productUpdated(() => refreshOwned(onChange))

  store.error(err => console.error('[billing]', err.message || err))

  return store.initialize([Platform.GOOGLE_PLAY]).then(() => {
    ready = true
    refreshOwned(onChange)
  }).catch(err => console.error('[billing] initialize failed', err))
}

// Starts the native purchase flow (shows Google's own payment sheet). Resolves once the flow
// closes — check `owned`/the store's premium field afterward rather than trusting the resolve
// alone, since a user can back out without an error being thrown.
export function purchase() {
  if (!AVAILABLE) return Promise.reject(new Error('Billing not available on this build'))
  const { store } = window.CdvPurchase
  const product = store.get(PRODUCT_ID)
  const offer = product?.getOffer()
  if (!offer) return Promise.reject(new Error('Subscription offer not loaded yet'))
  return store.order(offer)
}

// Play Store policy requires an explicit way to restore a subscription bought on another
// device/after a reinstall, even though Play Billing already re-syncs owned purchases on
// every initialize() — Settings surfaces this as its own button.
export function restorePurchases() {
  if (!AVAILABLE) return Promise.resolve()
  return window.CdvPurchase.store.restorePurchases()
}

// Deep link to Play Store's own subscription management — cancelling/changing payment method
// is Google's flow, not ours.
export const manageSubscriptionUrl = () =>
  `https://play.google.com/store/account/subscriptions?sku=${PRODUCT_ID}&package=${PACKAGE_ID}`

export const isBillingAvailable = () => AVAILABLE
export const isBillingReady = () => ready
