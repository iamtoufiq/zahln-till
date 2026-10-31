import type { Session } from "./interface";

export type SessionHandle = ReturnType<typeof createSession>;

export function createSession(login: () => Promise<Session>) {
  let current: Session | null = null;
  let inflight: Promise<string> | null = null;

  return {
    token: () => current?.accessToken ?? null,
    set(session: Session) {
      current = session;
    },
    clear() {
      current = null;
    },
    refresh(): Promise<string> {
      inflight ??= login()
        .then((session) => {
          current = session;
          return session.accessToken;
        })
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
  };
}
