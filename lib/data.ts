/**
 * Typed re-export of the build-time data.
 *
 * data.json is produced by scripts/build-data.ts and is the only file in
 * lib/ that's generated. The cast below is safe because the build script
 * has already validated every row against the Zod schemas — by the time
 * we import the JSON, the shape is guaranteed.
 *
 * App code should always import from here, never from data.json directly,
 * to get the proper types.
 */
import raw from "./data.json";
import type { Guest, Group, LayoutSection } from "./schema";

export const guests: readonly Guest[] = raw.guests as Guest[];
export const groups: readonly Group[] = raw.groups as Group[];
export const layout: readonly LayoutSection[] = raw.layout as LayoutSection[];
