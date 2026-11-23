// EXPO_PUBLIC_* vars must be referenced statically so Metro can inline them.
const API_URL = process.env.EXPO_PUBLIC_API_URL || undefined;

export const env = {
  API_URL: API_URL?.replace(/\/+$/, ""),
} as const;

/** No backend is configured, so the app shows demo data. */
export const IS_DEMO = !env.API_URL;
