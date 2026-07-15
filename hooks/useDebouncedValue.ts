"use client";

/**
 * Returns `value` delayed by `delay` ms — each new value resets the timer,
 * so the returned value only updates after the input goes quiet.
 *
 * Extracted from useGuestSearch so the RSVP landing search can share it.
 */
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
