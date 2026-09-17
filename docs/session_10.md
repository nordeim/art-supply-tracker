Session 10 — the seed-fidelity pass, continuing from session 9's verified state (main @ f741f57, 131 tests green, four-view + focus-flow parity).

Started from the pushed tree after a workspace refresh: environment rebuilt (`.env`, `db:push`, `db:seed`), all gates re-verified green (lint, typecheck, 131 tests, production build; skills/ excluded from every gate — eslint ignores, tsconfig exclude, vitest include), and the docs (AGENTS, CLAUDE, README, PAD v1.5, session 7–9 records) re-read against the source.

Fresh full-surface reconnaissance against the live app (operator account, pristine 0/0/15):

- Four-view VLM comparison at 1920×1080 — dashboard, projects, supplies, inspiration: **PARITY** on all four (the only deltas: account email and the dev-only Next.js badge). A first capture round had gone stale (eval-based clicks do not trigger the live SPA's navigation — only ref-based clicks do); every view was re-captured with DOM-verified navigation before comparison.
- Mobile (390×844) dashboard comparison: **PARITY**.
- Byte-level content verification against the live DOM: all 8 art-history entries (titles, dates, order), the quote tiles' order and detail panels (Cassatt, Degas — citation and rights text match), the Van Gogh entry body (em-dashes, "'exaggeration'", "most recognized paintings" — the live uses the American spelling in the entry body and the British "recognised" on the dashboard card; the clone mirrors both), the today-entry selection (Rembrandt), the quote-panel toggle behavior, and the chat timestamps (rendered in the browser's local timezone on both apps, same format).
- One live-side artifact noted: the account carries a "Hello from clone test" message (Sep 16, prior-agent residue on the operator's own account). The live UI has no chat delete affordance (the only "✕" controls are the two mobile-drawer Close buttons), so it cannot be removed through the app; it is live-side data, not a clone parity gap, and is deliberately not part of the seeded community content.

The one actionable finding: **the seeded chat history had silently "corrected" two of the live author's typos** — the seed stored "hi This is Kim I hope you love this app" and "It's a browser app for now" where the live renders "hi This is KIm I hope you love this app" and "It's a brower app for now" (byte-verified twice via DOM text extraction; each message appears identically in the live's desktop and mobile chat instances). The faithful-by-default principle (CLAUDE.md: don't "improve" cloned copy) requires byte-for-byte mirroring of the community content.

Remediation (TDD): RED — a new `src/lib/seed-fidelity.test.ts` following the file-content test pattern established by `design-tokens.test.ts` (reads `scripts/seed.ts` and pins its literals): all five messages' exact texts and UTC instants, the corrected spellings asserted ABSENT, and a documented-comment requirement so a future editor doesn't reach for the "fix". All three tests failed as designed. GREEN — the two seed lines updated to the live texts plus the do-not-"fix" comment; the local demo DB's chat rows cleared and re-seeded.

Verification: lint ✓, typecheck ✓, 134/134 tests ✓ (131 + 3 seed-fidelity), production build from a clean `.next` ✓, smoke suite 23/23 ✓, and a browser check confirming the running clone now renders "KIm" and "brower" with the corrected spellings absent. (A mid-session Turbopack cache corruption — caused by deleting `.next` while the dev server was running — was resolved by killing the server, clearing `.next` + `node_modules/.cache`, and restarting; noted here so the operator knows the clean-build sequence.) Live account left pristine (PROJECTS 0 / SUPPLIES 0 / INSPO 15); screenshots archived under `download/parity-evidence/r7-*`.

Documentation aligned: README (r7 status row, 134-test description, seed-fidelity bullet), AGENTS.md (134 tests, chat-fidelity bullet), CLAUDE.md (seed-fidelity test bullet), PAD v1.6 (revision block [R7], §7.1 distribution 111 unit + 23 action, §10 r7 resolution row), and this session record.

**Session 10 complete — seed content now mirrors the live app byte-for-byte.**

**Verification:** all claims executed and observed this session; the live account is pristine; the only accepted divergences remain documented; the live's operator-account test message is documented as out of scope for the seed.

**Suggested next steps:** watch the CI verify-gate run on the pushed commit; if the live community chat gains new messages, re-run the DOM extraction and extend the seed-fidelity test before updating the seed.
