export const WEIGHTS = {
  technical: 0.2,
  ownership: 0.2,
  collaboration: 0.15,
  delivery: 0.15,
  communication: 0.12,
  growth: 0.08,
} as const;

export type Ratings = Record<keyof typeof WEIGHTS, number>;

export function vouchScore(r: Ratings): number {
  const totalWeight = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 0.90
  const weighted = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce(
    (sum, key) => sum + r[key] * WEIGHTS[key],
    0,
  );
  return Math.round((weighted / totalWeight) * 20);
}
