export type LoadState = { failed: boolean; reconnecting: boolean };

const STATES = {
  ok: { failed: false, reconnecting: false },
  failed: { failed: true, reconnecting: false },
  reconnecting: { failed: false, reconnecting: true },
} satisfies Record<string, LoadState>;

// A failed refetch keeps the last data on screen; only a first load that fails replaces it.
export function loadState(query: { isError: boolean; data: unknown }): LoadState {
  if (!query.isError) return STATES.ok;
  return query.data === undefined ? STATES.failed : STATES.reconnecting;
}
