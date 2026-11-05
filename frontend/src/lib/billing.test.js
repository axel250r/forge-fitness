import { describe, it, expect } from 'vitest'
import { planOf, recurringPhase, planPrices, yearlySavingsPercent, yearlyPerMonth, pickOffer, formatLike } from './billing.js'

const P = 'loadout_premium_monthly'
const trial = { paymentMode: 'FreeTrial', price: '$0', priceMicros: 0, currency: 'CLP' }
const phase = (price, micros) => ({ paymentMode: 'PayAsYouGo', price, priceMicros: micros, currency: 'CLP' })

// What the plugin reports once both base plans are active, trial offers listed before the base plans
// (Play doesn't guarantee the order).
const monthlyTrial = { id: `${P}@monthly@prueba-7-dias`, pricingPhases: [trial, phase('$4.990', 4_990_000_000)] }
const monthlyBase = { id: `${P}@monthly`, pricingPhases: [phase('$4.990', 4_990_000_000)] }
const yearlyTrial = { id: `${P}@yearly@prueba-7-dias`, pricingPhases: [trial, phase('$34.990', 34_990_000_000)] }
const yearlyBase = { id: `${P}@yearly`, pricingPhases: [phase('$34.990', 34_990_000_000)] }
const both = { offers: [yearlyTrial, monthlyBase, monthlyTrial, yearlyBase], getOffer: () => monthlyBase }
const monthlyOnly = { offers: [monthlyTrial, monthlyBase], getOffer: () => monthlyBase }

describe('planOf', () => {
  it('reads the base plan out of an offer id', () => {
    expect(planOf(monthlyTrial)).toBe('monthly')
    expect(planOf(yearlyBase)).toBe('yearly')
  })
  it('is null for a missing offer', () => {
    expect(planOf(undefined)).toBeNull()
    expect(planOf({})).toBeNull()
  })
})

describe('recurringPhase / planPrices', () => {
  it('reports the post-trial price of each plan, never the free-trial $0', () => {
    expect(recurringPhase(both, 'monthly').price).toBe('$4.990')
    expect(recurringPhase(both, 'yearly').price).toBe('$34.990')
  })
  it('has no yearly price until Play reports the yearly plan', () => {
    const plans = planPrices(monthlyOnly)
    expect(plans.monthly.price).toBe('$4.990')
    expect(plans.yearly).toBeNull()
  })
  it('keeps the old single-price behaviour for offers without a base-plan id', () => {
    const legacy = { offers: [{ id: `${P}@token123`, pricingPhases: [trial, phase('$4.990', 4_990_000_000)] }] }
    expect(planPrices(legacy).monthly.price).toBe('$4.990')
  })
  it('is empty-safe', () => {
    expect(planPrices(undefined)).toEqual({ monthly: null, yearly: null })
  })
})

describe('yearlySavingsPercent', () => {
  it('compares the yearly price with twelve months', () => {
    expect(yearlySavingsPercent(planPrices(both))).toBe(42)   // 34.990 vs 59.880
  })
  it('is null without a yearly plan, unknown prices, or no real saving', () => {
    expect(yearlySavingsPercent(planPrices(monthlyOnly))).toBeNull()
    expect(yearlySavingsPercent({ monthly: { micros: 0 }, yearly: { micros: 5 } })).toBeNull()
    expect(yearlySavingsPercent({ monthly: { micros: 1_000_000 }, yearly: { micros: 13_000_000 } })).toBeNull()
  })
})

describe('yearlyPerMonth', () => {
  it('spreads the yearly price over twelve months in its currency', () => {
    expect(yearlyPerMonth(planPrices(both))).toBe('$2.916')
  })
  it('is null without a yearly plan', () => {
    expect(yearlyPerMonth(planPrices(monthlyOnly))).toBeNull()
  })
})

describe('pickOffer', () => {
  it('picks the free-trial offer of the plan asked for', () => {
    expect(pickOffer(both, 'monthly')).toBe(monthlyTrial)
    expect(pickOffer(both, 'yearly')).toBe(yearlyTrial)
  })
  it('falls back to the plain base plan when no trial offer exists', () => {
    const noTrial = { offers: [monthlyBase, yearlyBase] }
    expect(pickOffer(noTrial, 'yearly')).toBe(yearlyBase)
  })
  it('never buys the monthly plan when yearly was asked for', () => {
    expect(pickOffer(monthlyOnly, 'yearly')).toBeNull()
  })
  it('falls back to a non-yearly offer when monthly has no base-plan id', () => {
    const legacyTrial = { id: `${P}@token123`, pricingPhases: [trial, phase('$4.990', 4_990_000_000)] }
    expect(pickOffer({ offers: [yearlyTrial, legacyTrial] }, 'monthly')).toBe(legacyTrial)
  })
  it('never buys the yearly plan when monthly was asked for, even through the fallback', () => {
    const oddMonthly = { id: `${P}@mensual`, pricingPhases: [phase('$4.990', 4_990_000_000)] }
    expect(pickOffer({ offers: [yearlyTrial, yearlyBase, oddMonthly] }, 'monthly')).toBe(oddMonthly)
    expect(pickOffer({ offers: [yearlyTrial, yearlyBase] }, 'monthly')).toBeNull()
  })
  it('is null with nothing loaded', () => {
    expect(pickOffer({ offers: [] }, 'monthly')).toBeNull()
    expect(pickOffer(undefined, 'yearly')).toBeNull()
  })
})

describe('planPrices fallback', () => {
  it('never reports the yearly price as the monthly one', () => {
    const oddMonthly = { id: `${P}@mensual`, pricingPhases: [phase('$4.990', 4_990_000_000)] }
    const plans = planPrices({ offers: [yearlyTrial, oddMonthly] })
    expect(plans.monthly.price).toBe('$4.990')
    expect(plans.yearly.price).toBe('$34.990')
    expect(planPrices({ offers: [yearlyTrial] }).monthly).toBeNull()
  })
})

// Same shapes, but with the billing period Play actually reports (ISO 8601), as on a real device.
const per = (offer, period) => ({ ...offer, pricingPhases: offer.pricingPhases.map(p => p.paymentMode === 'FreeTrial' ? { ...p, billingPeriod: 'P1W' } : { ...p, billingPeriod: period }) })
const realM = [per(monthlyTrial, 'P1M'), per(monthlyBase, 'P1M')]
const realY = [per(yearlyTrial, 'P1Y'), per(yearlyBase, 'P1Y')]
const renewing = offer => [...offer.pricingPhases].reverse().find(p => p.paymentMode !== 'FreeTrial')

describe('label and charge always match (no 4.990 for a year, no 34.990 for a month)', () => {
  const orders = [
    [realY[0], realM[1], realM[0], realY[1]],
    [realM[0], realY[0], realY[1], realM[1]],
    [realY[1], realY[0], realM[1], realM[0]],
  ]
  for (const offers of orders) {
    it(`shown price = price of the ordered offer, for offer order ${offers.map(o => o.id.split('@').slice(1).join('@')).join(', ')}`, () => {
      const product = { offers }
      const plans = planPrices(product)
      const m = pickOffer(product, 'monthly'), y = pickOffer(product, 'yearly')
      expect(plans.monthly.price).toBe('$4.990')
      expect(plans.yearly.price).toBe('$34.990')
      expect(renewing(m).price).toBe(plans.monthly.price)
      expect(renewing(y).price).toBe(plans.yearly.price)
      expect(renewing(m).billingPeriod).toBe('P1M')
      expect(renewing(y).billingPeriod).toBe('P1Y')
      expect(planOf(m)).toBe('monthly')
      expect(planOf(y)).toBe('yearly')
    })
  }

  it('ignores a "yearly" base plan that Play reports as renewing monthly', () => {
    const badYearly = per(yearlyBase, 'P1M')
    const product = { offers: [...realM, badYearly] }
    expect(planPrices(product).yearly).toBeNull()        // no yearly option shown at all
    expect(pickOffer(product, 'yearly')).toBeNull()
    expect(pickOffer(product, 'monthly').id).toBe(realM[0].id)
  })

  it('ignores a "monthly" base plan that Play reports as renewing yearly', () => {
    const badMonthly = per(monthlyBase, 'P1Y')
    const product = { offers: [badMonthly, ...realY] }
    expect(planPrices(product).monthly).toBeNull()
    expect(pickOffer(product, 'monthly')).toBeNull()      // purchase() rejects instead of buying a year
    expect(pickOffer(product, 'yearly').id).toBe(realY[0].id)
  })

  it('the legacy monthly fallback skips offers that renew yearly, whatever their id', () => {
    const oddYear = per({ id: `${P}@anual`, pricingPhases: [phase('$34.990', 34_990_000_000)] }, 'P1Y')
    const oddMonth = per({ id: `${P}@mensual`, pricingPhases: [phase('$4.990', 4_990_000_000)] }, 'P1M')
    const product = { offers: [oddYear, oddMonth] }
    expect(pickOffer(product, 'monthly')).toBe(oddMonth)
    expect(planPrices(product).monthly.price).toBe('$4.990')
    expect(pickOffer({ offers: [oddYear] }, 'monthly')).toBeNull()
  })
})

describe('formatLike', () => {
  it('copies the store price shape: symbol, separators, decimals', () => {
    expect(formatLike('$34.990', 34990 / 12)).toBe('$2.916')          // CLP, no decimals
    expect(formatLike('$59.99', 59.99 / 12)).toBe('$5.00')            // USD
    expect(formatLike('R549,00', 549 / 12)).toBe('R45,75')            // ZAR
    expect(formatLike('ARS 53.900,00', 53900 / 12)).toBe('ARS 4.491,67')
    expect(formatLike('1 234,50 zł', 1234.5 / 12)).toBe('102,88 zł')
    expect(formatLike('₩59,000', 59000 / 12)).toBe('₩4,917')
  })
  it('is null without a number', () => {
    expect(formatLike('', 5)).toBeNull()
    expect(formatLike(undefined, 5)).toBeNull()
  })
})
