import { newer } from "./version";

type Versioned = { id: string; version: number };

// Remembers the highest version seen per id, across fetches and screens.
export function createVersionCache<T extends Versioned>() {
  const latest = new Map<string, T>();
  return {
    keep(item: T): T {
      const kept = newer(latest.get(item.id), item);
      latest.set(item.id, kept);
      return kept;
    },
  };
}
