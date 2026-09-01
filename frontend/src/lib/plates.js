// Plate math: given a target total weight and a bar weight, work out what to load per
// side. Greedy from the largest plate down — the way anyone loads a bar by hand, and the
// same approach every other tracker uses, so the answer matches what people expect.
export const PLATE_SETS = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
}
export const DEFAULT_BAR = { kg: 20, lb: 45 }

// Only plate-loaded barbell-family equipment — a cable stack or lever machine has nothing
// to load by hand, so the calculator would just be noise there.
const BARBELL_EQ = new Set(['barbell', 'ez barbell', 'olympic barbell', 'trap bar', 'smith machine'])
export const isPlateLoaded = eq => BARBELL_EQ.has(eq)

export function platesFor(total, barWeight, unit) {
  const perSide = (total - barWeight) / 2
  if (!(perSide > 0)) return { perSide: 0, plates: [], remainder: 0 }
  const set = PLATE_SETS[unit] || PLATE_SETS.kg
  let remaining = perSide
  const plates = []
  for (const p of set) {
    let count = 0
    // Small epsilon — repeated float subtraction can leave e.g. 4.999999999999999 instead of 5.
    while (remaining >= p - 1e-9) { remaining -= p; count++ }
    if (count) plates.push({ plate: p, count })
  }
  return { perSide, plates, remainder: Math.round(remaining * 100) / 100 }
}
