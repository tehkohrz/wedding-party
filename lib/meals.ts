/**
 * Meal-code → human label. The database stores the codes "A" / "B" / "K"
 * (stable, never renamed), while every ADMIN screen shows the couple's
 * own words — "Beef", "Chicken", "Kids" — from MENU in lib/content.ts.
 *
 * Guest-facing screens keep the lettered menu ("A. Roasted USDA Prime
 * Ribeye") because that's how the choice is presented on the invitation.
 */
import { MENU } from "@/lib/content";

export type FoodCode = "A" | "B" | "K";

/** Short label for a stored food code ("—" when there's no answer). */
export function mealLabel(code: FoodCode | null | undefined): string {
  if (code === "K") return MENU.kidsMeal.shortName;
  const main = MENU.mains.find((m) => m.id === code);
  return main ? main.shortName : "—";
}

/** Short label + the full dish name, for places with room to show both. */
export function mealFullLabel(code: FoodCode | null | undefined): string {
  if (code === "K") return `${MENU.kidsMeal.shortName} — ${MENU.kidsMeal.name}`;
  const main = MENU.mains.find((m) => m.id === code);
  return main ? `${main.shortName} — ${main.name}` : "—";
}
