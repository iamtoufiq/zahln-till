export type ServerClock = ReturnType<typeof createServerClock>;

export function createServerClock() {
  let offsetMs = 0;

  return {
    observe(dateHeader: string | null) {
      const serverMs = dateHeader ? Date.parse(dateHeader) : NaN;
      if (!Number.isNaN(serverMs)) offsetMs = serverMs - Date.now();
    },
    now: () => Date.now() + offsetMs,
  };
}
