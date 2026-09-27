/**
 * Dev-chrome fidelity (r28) — pins the dev-tools indicator OFF.
 *
 * Measured on 2026-09-27: every `next dev` capture of the clone carried
 * the Next.js dev-tools indicator badge — a 36×36 dark-gray button
 * (rendered by the `nextjs-portal` custom element's shadow DOM) fixed at
 * the viewport's bottom-left (x20, y788 at 390×844; x20, y~764 at
 * 1280×800). The live site carries no such badge, so every paired
 * capture diffed in that 36×36 patch (0.1-0.5% of each capture; the
 * whole y773-844 band of the mobile inspiration capture was badge-only —
 * probed pixel-by-pixel, 0 non-badge diff pixels).
 *
 * The badge is dev-mode chrome — it never ships in `next build` output —
 * but the repo's parity methodology captures against the DEV server, so
 * it polluted every round's measurements (silently, at capture time; the
 * r27 records' low login residuals imply it auto-hid or went unnoticed
 * in those sessions). `devIndicators: false` removes the badge from dev
 * mode; the dev overlay itself still functions on runtime errors, and
 * no production output changes.
 *
 * Do NOT re-enable the indicator without re-baselining the capture
 * methodology (prod-mode captures would also work — but then the badge
 * pin below should be replaced by a documented capture-mode contract,
 * not silently dropped).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));

describe("dev-tools indicator pin (r28: clean dev-mode captures)", () => {
  it("disables the dev-tools badge in next.config.ts", () => {
    const config = readFileSync(
      join(libDir, "../../next.config.ts"),
      "utf8",
    );
    expect(config).toContain("devIndicators: false");
  });
});
