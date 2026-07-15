import { APP_NAME } from "@/constants";
import type { Treatment, UserProfile } from "@/types/models";

/**
 * The brand shown across the app: the user's studio name once configured,
 * otherwise the app's own brand as a fallback.
 */
export function brandName(profile?: UserProfile | null): string {
  return profile?.studioName?.trim() || APP_NAME;
}

/** Up-to-two-letter monogram derived from a brand/studio name. */
export function monogramFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "•";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** "Bienvenida" / "Bienvenido" / "Te damos la bienvenida" per treatment. */
export function welcomeWord(treatment?: Treatment): string {
  switch (treatment) {
    case "feminine":
      return "Bienvenida";
    case "masculine":
      return "Bienvenido";
    default:
      return "Te damos la bienvenida";
  }
}

/**
 * Post-login greeting for the home header, adapted to the chosen treatment:
 * "Bienvenida de nuevo, Ana" / "Bienvenido de nuevo, Ana" / "Hola de nuevo, Ana".
 * Falls back gracefully when no name is set.
 */
export function greeting(profile?: UserProfile | null): string {
  const firstName = profile?.name?.trim().split(/\s+/)[0];
  const lead =
    profile?.treatment === "feminine"
      ? "Bienvenida de nuevo"
      : profile?.treatment === "masculine"
        ? "Bienvenido de nuevo"
        : "Hola de nuevo";
  return firstName ? `${lead}, ${firstName}` : lead;
}
