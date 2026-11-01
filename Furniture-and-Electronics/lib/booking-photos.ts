/**
 * Design Photos Helper
 *
 * Extracts and encodes design photo URLs stored within booking notes.
 * Free of any client/DOM/React dependencies; safe for both server API routes and client components.
 */

export function extractDesignPhotos(notes?: string | null): string[] {
  if (!notes) return [];
  const match = notes.match(/\[DESIGNS\]:(.*?)(?:\n|$)/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

