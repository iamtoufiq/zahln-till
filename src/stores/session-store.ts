import { create } from "zustand";

import type { User } from "@/api/interface";
import { resumeAs, signIn, signOut } from "@/api/api-instance";
import { orderIntents } from "@/lib/intents";
import { kv } from "@/lib/storage";

const USERNAME_KEY = "username";
const USER_KEY = "user";

type SessionState = {
  user: User | null;
  savedUsername: string | null;
  signIn: (username: string) => Promise<void>;
  signOut: () => void;
};

function readSaved(): Pick<SessionState, "user" | "savedUsername"> {
  const savedUsername = kv.get(USERNAME_KEY) ?? null;
  const raw = kv.get(USER_KEY);
  if (!savedUsername || !raw) return { user: null, savedUsername: null };
  // The first API call signs in again in the background; Home renders from this copy meanwhile.
  resumeAs(savedUsername);
  return { user: JSON.parse(raw) as User, savedUsername };
}

export const useSessionStore = create<SessionState>((set) => ({
  ...readSaved(),
  signIn: async (username) => {
    const result = await signIn(username);
    kv.set(USERNAME_KEY, username);
    kv.set(USER_KEY, JSON.stringify(result.user));
    set({ user: result.user, savedUsername: username });
  },
  signOut: () => {
    signOut();
    // The next cashier cannot see this till's orders, so an open one must not follow them.
    orderIntents.clear();
    kv.delete(USERNAME_KEY);
    kv.delete(USER_KEY);
    set({ user: null, savedUsername: null });
  },
}));
