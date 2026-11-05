// Google Play Billing (VigorUp Premium) via cordova-plugin-purchase, which wraps the native
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
export const FALLBACK_PRICE = '$4.990'

// The plugin only exists in the native Capacitor/Android build (window.CdvPurchase is never
// defined in the browser or the self-hosted web build) — every export here is a safe no-op
// outside that build instead of throwing.
const AVAILABLE = typeof window !== 'undefined' && !!window.CdvPurchase

let owned = false
let ready = false
let plans = null

// One Play product, two base plans: the monthly one (with a 7-day free-trial offer) and the
// yearly one (same trial offer). The plugin names every offer "<product>@<basePlan>" or
// "<product>@<basePlan>@<offerId>", so the base plan is the second segment.
export const PLAN_MONTHLY = 'monthly'
export const PLAN_YEARLY = 'yearly'
export const planOf = offer => String(offer?.id || '').split('@')[1] || null

// Second safety net on top of the base-plan id: the renewing phase's real billing period, as Play
// reports it (ISO 8601). An offer only counts for a plan when that period matches, so a base plan
// misconfigured in Play Console (say "yearly" set to renew monthly) is never shown under the
// wrong label nor sold as the wrong plan. Offers that report no period are let through, as before.
const PERIODS = { [PLAN_MONTHLY]: ['P1M'], [PLAN_YEARLY]: ['P1Y', 'P12M'] }
const renewingPhase = offer => [...(offer?.pricingPhases || [])].reverse().find(p => p.paymentMode !== 'FreeTrial')
const periodOk = (offer, plan) => {
  const period = renewingPhase(offer)?.billingPeriod
  return !period || PERIODS[plan].includes(period)
}
const offersOf = (product, plan) => (product?.offers || []).filter(o => planOf(o) === plan && periodOk(o, plan))
// Fallback pool for the monthly side when no offer carries the "monthly" base-plan id (an older
// product shape): every offer EXCEPT the yearly ones (by id or by period), so a monthly price or
// purchase can never land on the yearly plan.
const nonYearlyOffers = product => (product?.offers || []).filter(o => planOf(o) !== PLAN_YEARLY && periodOk(o, PLAN_MONTHLY))
const hasTrial = offer => !!offer?.pricingPhases?.some(p => p.paymentMode === 'FreeTrial')

// The price shown in the paywall is the ongoing, post-trial price — never a free-trial phase's
// $0, which product.pricing (offers[0].pricingPhases[0]) could easily land on the moment a free
// trial offer exists, since Play doesn't guarantee offer order. Takes the last non-trial phase
// of the plan's offers: the one that keeps renewing. Same "$4.990"/"$5.25"-style live,
// store-localized string either way; `micros` and `currency` feed the yearly-savings math.
export function recurringPhase(product, plan) {
  for (const offer of offersOf(product, plan)) {
    const phase = summary(renewingPhase(offer))
    if (phase) return phase
  }
  return null
}
const summary = phase => phase ? { price: phase.price, micros: phase.priceMicros || 0, currency: phase.currency || null } : null

// { monthly, yearly } — each a phase summary or null while Play hasn't reported that plan (the
// yearly plan only shows up once it's active in Play Console). If no offer carries the monthly
// base-plan id, the monthly price is read off the very offer purchase('monthly') would order,
// so the label and the charge can't disagree.
export function planPrices(product) {
  const monthly = recurringPhase(product, PLAN_MONTHLY) || summary(renewingPhase(pickOffer(product, PLAN_MONTHLY)))
  return { monthly, yearly: recurringPhase(product, PLAN_YEARLY) }
}

// Whole-percent saving of paying yearly vs twelve months, or null when either price is
// unknown (micros 0) or the yearly plan isn't actually cheaper.
export function yearlySavingsPercent(plans) {
  const m = plans?.monthly?.micros, y = plans?.yearly?.micros
  if (!m || !y) return null
  const pct = Math.round((1 - y / (m * 12)) * 100)
  return pct > 0 ? pct : null
}

// Writes `value` in the same shape as a store-formatted price: same symbol and its position,
// same thousands and decimal separators, same number of decimals. "$34.990" + 2915.83 →
// "$2.916"; "R549,00" + 45.75 → "R45,75". A last group of exactly three digits is read as
// thousands, never decimals (no Play currency shows three decimals). Null if no number is found.
export function formatLike(sample, value) {
  const m = String(sample || '').match(/\d(?:[\d.,\s  ]*\d)?/)
  if (!m) return null
  const num = m[0]
  const dec = num.match(/([.,])(\d{1,2})$/)
  const decimals = dec ? dec[2].length : 0
  const intPart = dec ? num.slice(0, -dec[0].length) : num
  const group = (intPart.match(/[.,\s  ]/) || [''])[0]
  const [i, f] = Math.abs(value).toFixed(decimals).split('.')
  const grouped = group ? i.replace(/\B(?=(\d{3})+(?!\d))/g, group) : i
  return sample.replace(num, f ? grouped + dec[1] + f : grouped)
}

// Yearly price spread over twelve months, written like Play writes the yearly price ("$2.916").
export function yearlyPerMonth(plans) {
  const y = plans?.yearly
  if (!y?.micros || !y.price) return null
  return formatLike(y.price, y.micros / 1e6 / 12)
}

// The offer to buy for a plan: the one with a free-trial phase when Play offers it (Play doesn't
// guarantee offer order, so a trial offer could otherwise end up ignored half the time), else the
// plain base plan. Each plan only ever buys its own offers: yearly never falls back to monthly,
// and monthly's fallback (older product shape without base-plan ids) skips every yearly offer.
export function pickOffer(product, plan) {
  const offers = offersOf(product, plan)
  const found = offers.find(hasTrial) || offers.find(o => String(o.id).split('@').length === 2) || offers[0]
  if (found) return found
  if (plan !== PLAN_MONTHLY) return null
  const pool = nonYearlyOffers(product)
  return pool.find(hasTrial) || pool[0] || null
}

const samePlans = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function refreshOwned(onChange) {
  const { store } = window.CdvPurchase
  const product = store.get(PRODUCT_ID)
  const next = !!product?.owned
  const nextPlans = planPrices(product)
  if (next === owned && samePlans(nextPlans, plans)) return
  owned = next
  plans = nextPlans
  onChange(owned, plans)
}

// Call once at boot. `onChange(owned, plans)` fires every time subscription status or the
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
    // Ownership changes arrive as receipt updates, not product updates: listening to
    // productUpdated alone left a just-paid subscriber looking at the paywall until the app
    // restarted (found in a real test purchase, Nov 2026). Both feed the same idempotent
    // refresh; finished covers the moment the purchase is acknowledged.
    .productUpdated(() => refreshOwned(onChange))
    .receiptUpdated(() => refreshOwned(onChange))
    .finished(() => refreshOwned(onChange))

  store.error(err => console.error('[billing]', err.message || err))

  return store.initialize([Platform.GOOGLE_PLAY]).then(() => {
    ready = true
    refreshOwned(onChange)
  }).catch(err => console.error('[billing] initialize failed', err))
}

// Starts the native purchase flow (shows Google's own payment sheet). Resolves once the flow
// closes — check `owned`/the store's premium field afterward rather than trusting the resolve
// alone, since a user can back out without an error being thrown.
export function purchase(plan = PLAN_MONTHLY) {
  if (!AVAILABLE) return Promise.reject(new Error('Billing not available on this build'))
  const { store } = window.CdvPurchase
  const offer = pickOffer(store.get(PRODUCT_ID), plan)
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
