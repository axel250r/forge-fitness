// Google Play Billing (Loadout Premium) via cordova-plugin-purchase, which wraps the native
// Play Billing Library. The actual price is never hardcoded here — it's whatever's configured
// for PRODUCT_ID in Play Console's Monetization section, read live off the product and mirrored
// into useStore's `premiumPrice` (FALLBACK_PRICE is only the pre-load placeholder).
//
// Verification is device-only, on purpose: Play's billing service is already the source of
// truth for whether a purchase happened, and this app runs no server to re-check receipts
// against — same "everything stays on your phone" design as the rest of it (see Settings'
// "no account, no cloud" copy). The tradeoff: a rooted/tampered device could in theory spoof
// an owned subscription locally. Accepted risk for a cheap fitness-app subscription with no
// resale value — revisit if that ever changes (e.g. add a validator via store.validator,
// ideally with a lightweight server, if piracy becomes an actual problem).
export const PRODUCT_ID = 'loadout_premium_monthly'
export const PACKAGE_ID = 'com.loadoutfit.app'

// Cosmetic placeholder shown only in the sliver of time before Play Billing reports the real,
// store-localized price — practically never seen (boot() waits on that query). Keep roughly in
// step with the CLP price set in Play Console so the flash isn't jarring; nothing charges from
// this value.
export const FALLBACK_PRICE = '$5.000'

// The plugin only exists in the native Capacitor/Android build (window.CdvPurchase is never
// defined in the browser or the self-hosted web build) — every export here is a safe no-op
// outside that build instead of throwing.
const AVAILABLE = typeof window !== 'undefined' && !!window.CdvPurchase

let owned = false
let ready = false
let price = null

// The price shown in the paywall is the ongoing, post-trial price — never a free-trial phase's
// $0, which product.pricing (offers[0].pricingPhases[0]) could easily land on the moment a free
// trial offer exists, since Play doesn't guarantee offer order. Walks every offer looking for a
// non-trial phase; same "$4.990"/"$5.25"-style live, store-localized string either way.
function recurringPrice(product) {
  for (const offer of product?.offers || []) {
    const phase = offer.pricingPhases?.find(p => p.paymentMode !== 'FreeTrial')
    if (phase) return phase.price
  }
  return product?.pricing?.price || null
}

function refreshOwned(onChange) {
  const { store } = window.CdvPurchase
  const product = store.get(PRODUCT_ID)
  const next = !!product?.owned
  const nextPrice = recurringPrice(product)
  if (next === owned && nextPrice === price) return
  owned = next
  price = nextPrice
  onChange(owned, price)
}

// Call once at boot. `onChange(owned, price)` fires every time subscription status or the
// product's pricing info changes — the caller (useStore) mirrors both into store state so
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
  // Play doesn't guarantee offer order (product.getOffer() with no id is just offers[0]), so a
  // free-trial offer configured in Play Console's Monetization section could otherwise end up
  // ignored half the time. Prefer whichever offer actually has a FreeTrial pricing phase —
  // falls back to the default offer for anyone Play doesn't consider trial-eligible (e.g. a
  // past subscriber), same as before this existed.
  const offer = product?.offers?.find(o => o.pricingPhases?.some(p => p.paymentMode === 'FreeTrial')) || product?.getOffer()
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
