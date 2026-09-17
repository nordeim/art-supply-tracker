/**
 * Seed-content fidelity contract — pins the seeded community chat history
 * to the LIVE app's rendered messages, byte-for-byte, typos included.
 *
 * Why a file-content test: the live Studio Chat is community content, and
 * the clone's contract is faithful-by-default (CLAUDE.md: "Don't 'improve'
 * copy that was cloned deliberately"). The live author's messages carry two
 * typos ("KIm", "brower") that a well-meaning edit could silently "fix",
 * drifting the demo studio away from the production app this repo clones.
 * The design-tokens test established the pattern of reading the source file
 * and pinning its literals; this test does the same for scripts/seed.ts.
 *
 * Ground truth captured 2026-09-17 from studiobeta.artsupplytracker.com
 * (operator account, DOM text extraction — each message appears twice in
 * the live DOM because the live renders the chat in both the desktop column
 * and the mobile drawer; both copies carry the identical typo'd text).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const seedPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../scripts/seed.ts",
);
const seed = readFileSync(seedPath, "utf8");

/** The live chat history, verbatim (message text + UTC instant). */
const LIVE_CHAT: ReadonlyArray<{ message: string; at: string }> = [
  {
    message: "hi This is KIm I hope you love this app",
    at: "2026-06-13T20:40:00Z",
  },
  {
    message:
      "Hey Kim. Dig the app. Like the projects section. Can I download this app on my iPad? I found entering my paints individually to be cumbersome. But I like that I can add a photo.",
    at: "2026-06-20T02:22:00Z",
  },
  {
    message:
      "Yes! Yeah! It's a brower app for now, so you can log in from your iPad. You'd have to upload a photo and I will be adding the ability to take pictures this coming week",
    at: "2026-06-20T05:57:00Z",
  },
  { message: "Nice. Seems to be working", at: "2026-06-20T21:54:00Z" },
  { message: "testing", at: "2026-07-21T04:37:00Z" },
];

describe("seed fidelity — community chat history (live ground truth)", () => {
  it("seeds exactly the live's five community messages", () => {
    // The live history is 5 community messages (kimsart ↔ kevbo33w). The
    // operator's later test message ("Hello from clone test", Sep 16) is
    // live-side residue with no delete affordance in the live UI — it is
    // not part of the reference community content and must NOT be seeded.
    expect(LIVE_CHAT).toHaveLength(5);
    for (const { message, at } of LIVE_CHAT) {
      expect(seed).toContain(`message: ${JSON.stringify(message)}`);
      expect(seed).toContain(`at: new Date("${at}")`);
    }
  });

  it("keeps the live author's typos (faithful-by-default)", () => {
    // "KIm" — the capital-I typo in the live's first message. The corrected
    // "This is Kim" spelling must NOT appear anywhere in the seed.
    expect(seed).toContain("This is KIm I hope you love this app");
    expect(seed).not.toContain("This is Kim I hope you love this app");

    // "brower" — the live's misspelling of "browser" in the third message.
    // The corrected spelling would drift the clone from the live rendering.
    expect(seed).toContain("It's a brower app for now");
    expect(seed).not.toContain("It's a browser app for now");
  });

  it("documents that the typos are deliberate", () => {
    // A future editor seeing "KIm"/"brower" will reach for the fix unless
    // the seed says not to. The comment is part of the contract.
    expect(seed).toMatch(/typo/i);
  });
});
