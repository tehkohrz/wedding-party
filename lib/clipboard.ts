"use client";

/**
 * Copy text to the clipboard, with the execCommand fallback that still
 * works where the async Clipboard API is unavailable (older iOS Safari,
 * non-secure contexts). Shared by the admin Links and Chase tabs.
 *
 * Returns false if both routes fail, so callers can tell the user.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const done = document.execCommand("copy");
      document.body.removeChild(ta);
      return done;
    } catch {
      return false;
    }
  }
}
