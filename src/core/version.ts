export function newer<T extends { version: number }>(held: T | undefined, incoming: T): T {
  return held && held.version > incoming.version ? held : incoming;
}
