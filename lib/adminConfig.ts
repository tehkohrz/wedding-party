/**
 * Admin gate configuration, read from environment variables.
 *
 * Next.js inlines NEXT_PUBLIC_* vars at BUILD time — they're baked into the
 * bundle, not read live. So changing .env.local requires a dev-server
 * restart (or rebuild) to take effect.
 *
 * Centralized here so components reference typed constants instead of
 * scattering process.env string lookups.
 */

/** Whether /admin requires a PIN. Toggle in .env.local. */
export const ADMIN_PIN_ENABLED =
  process.env.NEXT_PUBLIC_ADMIN_PIN_ENABLED === "true";

/** The expected PIN. Empty string if unset. */
export const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "";
