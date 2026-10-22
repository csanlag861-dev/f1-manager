export type RandomGenerator = () => number;

/**
 * Standard Box-Muller transform to generate normally distributed random numbers
 * with mean = 0 and standard deviation = 1.
 */
export function normalRandom(mean = 0, stdDev = 1, rng: RandomGenerator = Math.random): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z0 * stdDev;
}

/**
 * Simple Linear Congruential Generator (LCG) for deterministic tests.
 */
export function createDeterministicRng(seed = 12345): RandomGenerator {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
