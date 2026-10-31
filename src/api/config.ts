// Read from .env at build time; copy .env.example to .env before the first run.
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const CANDIDATE_ID = process.env.EXPO_PUBLIC_CANDIDATE_ID;

if (!BASE_URL || !CANDIDATE_ID) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL and EXPO_PUBLIC_CANDIDATE_ID must be set in .env");
}

export const API_CONFIG = { BASE_URL, CANDIDATE_ID };
