import Constants from "expo-constants";

import { createClient } from "./client";
import { createServerClock } from "./clock";
import { logRequests } from "./dev-log";
import { API_CONFIG } from "./config";
import { ENDPOINTS } from "./endpoints";
import { createFaultyFetch, type FaultMode } from "./faults";
import type { Session } from "./interface";
import { createSession } from "./session";

export type { ApiResult } from "./client";

const SEEDED_PASSWORD = "test1234";

// Looks fetch up on every call, so tools that wrap it later (the dev network inspector) see our requests.
const liveFetch: typeof fetch = (input, init) => globalThis.fetch(input, init);

let faultMode: FaultMode = "off";
let signedInAs: string | null = null;

export const appVersion = Constants.expoConfig?.version ?? "0.0.0";
export const clock = createServerClock();

// The instance owns the session: it signs in again on its own when the token expires.
export const session = createSession(async () => {
  if (!signedInAs) throw new Error("No user to sign in again");
  return requestSession(signedInAs);
});

const apiInstance = createClient({
  baseUrl: API_CONFIG.BASE_URL,
  candidateId: API_CONFIG.CANDIDATE_ID,
  appVersion,
  session,
  clock,
  fetch: __DEV__ ? createFaultyFetch(logRequests(liveFetch), () => faultMode) : liveFetch,
});

async function requestSession(username: string): Promise<Session> {
  const { data } = await apiInstance.request<Session>("POST", ENDPOINTS.SESSIONS, {
    body: { username, password: SEEDED_PASSWORD },
    anonymous: true,
  });
  return data;
}

export async function signIn(username: string): Promise<Session> {
  signedInAs = username;
  const result = await requestSession(username);
  session.set(result);
  return result;
}

/** Restores a saved user without a request; the first call signs in again in the background. */
export function resumeAs(username: string) {
  signedInAs = username;
}

export function signOut() {
  signedInAs = null;
  session.clear();
}

export const getFaultMode = () => faultMode;

export function setFaultMode(mode: FaultMode) {
  if (__DEV__) faultMode = mode;
}

export default apiInstance;
