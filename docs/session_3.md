Session 3 — full-parity remediation against the live app (data model, detail panels, delete, filters, wire format, security, tests, CI).

## Reconnaissance (validated against the live site)

Logged into studiobeta.artsupplytracker.com and compared every interaction surface against the clone. Findings (all verified by DOM inspection; every test item created on the live app was deleted afterwards — the live account is back to its pristine 0/0 state):

1. **[HIGH][bug] Photo validation broken** — the server Zod schema capped photo data URLs at 500 characters while the client contract allows 300 KB (~400k chars); every real photo failed with "Please check the project form.".
2. **[HIGH][parity] Data vocabulary mismatch** — the live app stores category tokens `Paint | Brush | Pastel | Paper | Canvas | Medium | Other`, conditions `ok | low | critical`, and capitalized Paint subcategories; the clone used `paint | brushes-tools | …`, `critical-out`, and lowercase paint types.
3. **[HIGH][parity] Subcategory picker** — the live supply modal renders the chosen category's subcategory list between "— None —" and "Other / Custom…" (`__other__`), and hides the picker for the Other category; the clone showed a flat paint list always.
4. **[HIGH][parity] Detail panels missing** — clicking a chip on the live app opens a detail card (SUPPLY / PROJECT eyebrow, NEW badge, fields, Close / Delete / Edit actions), not the edit modal.
5. **[HIGH][parity] Delete missing** — the live app deletes projects and supplies behind a native confirm ("Delete this project? This cannot be undone." / "Delete this supply? This cannot be undone."); the clone had the actions but no UI.
6. **[HIGH][parity] Stock filters missing** — live supply lists carry "All | Low Stock | Out of Stock" tabs with a "No supplies match this filter." empty state.
7. **[HIGH][parity] Export payload incompatible** — captured a live export verbatim: projects use `title`/`description`/`coverImageUrl`/`imageKeys`/`supplyIds`/`images`/`imagePaths`/`isNew`; supplies use `subcategory`/`itemType`/`unit`/`tags`/numeric `quantityValue`+`quantity`+`qty`/`imageKey`/`usedInProjectIds`/`image`/`status` (omitted when ok)/`isNew`. The clone's own shape meant live exports failed import.
8. **[HIGH][parity] Active stat wrong** — the live sidebar counts only In Progress projects as "active" (1 planned → "0 active"); the clone counted planned + in-progress.
9. **[MED][parity] Supply chips** — NEW badge, condition-driven name color (cyan when low/critical), "Category · Subcategory" sub-line, "?" pill for OK / label pill otherwise, "qty N"; category tiles show a "!" badge (bg-[#F6B94B]/20 text-[#F6B94B]) when a category holds low/critical stock; singular "1 item" counts.
10. **[MED][parity] Mobile** — the live app toggles the community panel with a "Chat ☰" header button (it is not stacked below the view).
11. **[MED][security] No sign-in rate limiting** (PAD §10 open item).
12. **[MED][coverage] No action-layer tests** (PAD §10 open item).
13. **[MED][docs] Doc/CI misalignment** — the SSH push runbook referenced `.github/workflows/verify-gate.yml` and an `e2e:all` script that did not exist.
14. **[LOW] Supply assignment** — the live project detail panel assigns supplies in place ("Pick supply…" + Assign, "· name ×" list, "All supplies assigned").
15. **[LOW] signUp race** — concurrent duplicate emails surfaced INTERNAL instead of the friendly duplicate-account copy.

## Remediation (TDD: red → green, 82 tests total)

| # | Change | Files |
|---|---|---|
| P0 | Failing tests first: vocabulary (live tokens), photo caps, subcategory cross-validation, wire format, rate limiter | `src/lib/*.test.ts` (red at 28 failures) |
| P1 | Domain switched to the live vocabulary; `subcategoryOptionsFor` picker options; `isNewItem` (7-day NEW window); `parseQuantityValue` (ints/decimals/a-b fractions); `MAX_PHOTO_DATA_URL_LENGTH` (400k) shared by every schema; live wire-format builders/normalizers accepting BOTH live and legacy clone shapes | `studio-domain.ts`, `validation.ts`, `dto.ts` (`subcategory` DTO field, live-shaped `ExportPayload`), `export-payload.ts` (new) |
| P2 | Rate limiter (fixed window, 5/60s/IP, bounded memory) wired into `signInAction`; `setSupplyAssignment` action with ownership checks; P2002 duplicate-email catch | `rate-limit.ts` (new), `actions/auth.ts`, `actions/studio.ts` |
| P3 | Supply modal: per-category subcategory picker (hidden for Other, resets invalid values), "— Studio inventory (unassigned) —" label | `supply-modal.tsx` |
| P4 | Supplies view: flat list mode + All/Low/Out filter tabs, post-create navigation to the list (key-remount pattern), live chip styling, supply detail panel with Delete/Edit, "!" tile indicators, singular counts, breadcrumb in the header | `supplies-view.tsx`, `supply-detail-panel.tsx` (new) |
| P5 | Projects view: chips with NEW badge + status pill, project detail panel with budget, image well, supply assignment (Pick supply…/Assign/×), Delete + Edit Project, "1 PROJECT" headers, singular tile counts | `projects-view.tsx`, `project-detail-panel.tsx` (new) |
| P6 | Shell: active = In Progress only, sidebar active-view highlight, mobile "Chat ☰" toggle, export via `buildExportPayload`, delete handlers with side-effect reconciliation | `studio-app.tsx`, `studio-sidebar.tsx`, `page.tsx` |
| P7 | Action-layer tests: throwaway SQLite DB per file, mocked auth seam, IDOR/ownership, delete side-effects, live + legacy import, chat validation | `src/actions/studio.test.ts` (17 tests) |
| P8 | CI verify-gate workflow (lint + typecheck + test + build); runbook gate wording aligned to what exists | `.github/workflows/verify-gate.yml` (new), `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` |
| P9 | Docs aligned: README features/testing/status, AGENTS commands/invariants, CLAUDE testing strategy/data layer, PAD v1.1 (ADR-008 wire format, ADR-009 rate limiting, schema notes, test tables, known issues, key files) | all four docs + this file |

Design decisions worth remembering:

- **Values follow the live app** (Paint/Brush/…, ok/low/critical) so chips, tiles, and exports need no mapping; the legacy clone vocabulary is translated on import by `normalizeImportPayload`'s mapping tables.
- **The live project→`supplyIds` relation** is derived at export time from `Supply.assignedProjectId` (single membership — the live supply modal's assign select is single-valued too); imports resolve `supplyIds` positionally onto the re-created rows.
- **Dev DBs created before this change** hold the old vocabulary; they are disposable (gitignored, no seeded supplies) — `bun run db:push && bun run db:seed` recreates a clean database, and the import normalizer still accepts old-shape exports.
- **NEW badge window** (7 days) and the OK-condition "?" pill are documented assumptions/observations of live behavior that cannot be verified without multi-day waits.
- The live app's inconsistent `updatedAt` (epoch millis after an edit vs ISO strings otherwise) is deliberately NOT replicated.

## Verification

- Gates: `bun run lint` ✓ · `bun run typecheck` ✓ · `bun run test` (82 tests: 65 lib + 17 action) ✓ · `bun run build` ✓.
- Browser E2E on the clone: per-category picker (Paint/Brush lists, hidden for Other) · supply create → list view with tabs · chip → detail panel · edit to Low → chip/detail/pill update · Low/Out filters with empty state · "!" tile indicator · project create → All Projects chip → detail panel → supply Assign/× · export payload byte-matches the live shape · live-export import round-trip (assignments intact) · project + supply delete with the exact live confirm copy · mobile "Chat ☰" toggle open/close · rate limiting (6th bad login blocked, recovery after the window).
- Dashboard text diff vs the live app: identical modulo the signed-in account.
- Live app left pristine (all reconnaissance items deleted); reference screenshots in `download/reference/`.
