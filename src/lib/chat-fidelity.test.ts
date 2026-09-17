/**
 * Chat panel structure fidelity — r8 file-content pins.
 *
 * Why a file-content test (the design-tokens pattern): the community chat
 * column's parity contract lives in its class strings. The live DOM was
 * measured post-hydration on 2026-09-17 at 1920x1080 and 390x844:
 *
 * - The live SPLITS the panel into (1) a sticky community header —
 *   `sticky top-4 z-10 mb-4 space-y-3` holding the Community label, the
 *   Studio Chat heading, the Studio Memory card, and the Need help? card —
 *   and (2) a separately scrolling chat container. The sticky `top-4`
 *   itself displaces the header 16px below the aside's padding edge
 *   (measured: Community paragraph y=121 on both the live and the fixed
 *   clone; a static wrapper renders y=105). One space-y-3 wrapper around
 *   everything (the old clone shape) puts the whole column 16px high and
 *   leaves the memory card 16px shy of the live position.
 * - Desktop scroll container (live class list verbatim):
 *   `scrollbar-right max-h-[calc(100vh-16rem)] space-y-4 overflow-y-auto
 *   pr-1` — the message card scrolls as ONE unit past 100vh-16rem.
 * - Mobile drawer wrapper (live verbatim): plain `space-y-4` — the drawer
 *   aside itself scrolls; no scrollbar-right, no max-h.
 * - StudioChat card (live bundle verbatim): `bg-[#120724] border
 *   border-ast_blue/20 rounded-xl p-4 h-full min-w-0 overflow-hidden flex
 *   flex-col` with the message list `flex-1 space-y-3 mb-4
 *   overflow-y-auto` — NO studio-scrollbar styling on the list.
 * - The live has NO auto-scroll: its bundle renders new messages without
 *   touching scrollTop (no scrollIntoView/scrollTop in the chat
 *   component). The clone's stickToBottom behavior was an extra.
 * - Send errors render in the live's `text-pink-300`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));
const shell = readFileSync(join(libDir, "../components/studio/studio-app.tsx"), "utf8");
const chat = readFileSync(join(libDir, "../components/studio/studio-chat.tsx"), "utf8");
// Strip comments so explanatory notes (which name the removed behaviors)
// do not trip the negative pins.
const chatCode = chat.replace(/\/\*[\s\S]*?\*\//g, "");

describe("chat panel split (sticky header + scroll container)", () => {
  it("wraps the community header in the live's sticky block", () => {
    expect(shell).toContain('<div className="sticky top-4 z-10 mb-4 space-y-3">');
  });

  it("renders the desktop chat in the live's max-height scroll container", () => {
    expect(shell).toContain(
      "scrollbar-right max-h-[calc(100vh-16rem)] space-y-4 overflow-y-auto pr-1",
    );
  });

  it("renders the mobile drawer chat in the live's plain space-y-4 wrapper", () => {
    expect(shell).toContain('chatScrollClass="space-y-4"');
  });

  it("does not keep the old single space-y-3 community wrapper", () => {
    expect(shell).not.toContain('<div className="space-y-3">');
  });
});

describe("StudioChat card (live bundle verbatim)", () => {
  it("pins the card classes from the live bundle", () => {
    expect(chat).toContain(
      '"bg-[#120724] border border-ast-blue/20 rounded-xl p-4 h-full min-w-0 overflow-hidden flex flex-col"',
    );
  });

  it("pins the message-list classes from the live bundle", () => {
    expect(chat).toContain('"flex-1 space-y-3 mb-4 overflow-y-auto"');
  });

  it("does not style the message list with the studio scrollbar", () => {
    expect(chatCode).not.toContain("scrollbar-studio");
  });

  it("has no auto-scroll (the live renders new messages without scrolling)", () => {
    expect(chatCode).not.toContain("scrollTop");
    expect(chatCode).not.toContain("stickToBottom");
  });

  it("renders send errors in the live's text-pink-300", () => {
    expect(chat).toContain("text-pink-300");
  });
});
