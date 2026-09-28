/**
 * Session-scoped NEW badges (r31) — the live's badge lifecycle.
 *
 * The live app's NEW badges (project chip, project detail h2, supply
 * chip, supply detail h2) mark items CREATED DURING THE CURRENT SPA
 * SESSION — not items younger than some time window. Measured on the
 * live 2026-09-28: an item created in-session badges immediately on
 * every surface; a full page reload drops every badge (the session's
 * client state died with the page); the next in-session create badges
 * again. A 6-second-old item unbadges on reload while an 8-second-old
 * item still badges without one — the time-window hypothesis is
 * eliminated by construction.
 *
 * Replicated here as an in-memory registry of ids created this
 * session: module state survives client-side navigation (the badge
 * persists while the SPA lives) and dies on reload (a fresh module
 * instance starts with an empty registry), which is exactly the live's
 * observable contract. Seed rows and items created in earlier sessions
 * never badge.
 */

/** Ids created during the current client session (module lifetime). */
const createdThisSession = new Set<string>();

/** Record that an item was created during this session (the create
 * flows call this with the Server Action's created dto id — the only
 * way an id enters the registry). */
export function markCreatedThisSession(id: string): void {
  createdThisSession.add(id);
}

/** The badge predicate: true only for ids created this session. */
export function isNewSessionItem(id: string): boolean {
  return createdThisSession.has(id);
}

/** Clear the registry — tests simulate a page reload with this; the
 * real reload needs no call (a fresh module instance starts empty). */
export function resetSessionNewBadges(): void {
  createdThisSession.clear();
}
