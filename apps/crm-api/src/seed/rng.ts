/** Seeded pseudo-random number generator (mulberry32). */
export function createRng(seed: number) {
  let state = seed >>> 0;

  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function floatBetween(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

export function deterministicId(namespace: string, key: string): string {
  const input = `${namespace}:${key}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  const part2 = ((Math.abs(hash) * 2654435761) >>> 0).toString(16).padStart(4, "0").slice(0, 4);
  const part3 = ((Math.abs(hash) * 1597334677) >>> 0).toString(16).padStart(3, "0").slice(0, 3);
  const part4 = ((Math.abs(hash) * 2246822519) >>> 0).toString(16).padStart(12, "0").slice(0, 12);
  return `${hex.slice(0, 8)}-${part2}-4${part3}-8${part4.slice(0, 3)}-${part4.slice(3, 15)}`;
}

export function maybe<T>(rng: () => number, probability: number, value: T): T | null {
  return rng() < probability ? value : null;
}

export function shuffle<T>(rng: () => number, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
