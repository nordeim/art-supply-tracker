/**
 * Static-asset image fidelity (r28) — pins the `unoptimized` contract on
 * every `next/image` usage that renders a PUBLIC asset.
 *
 * Why: the live app serves its asset files as ORIGINAL BYTES from its CDN
 * (S3/CloudFront, content-identical to `public/assets/*` — md5-verified).
 * A default `next/image` usage routes through the Next image optimizer
 * (`/_next/image?url=…&w=…&q=75`), which RE-ENCODES the asset (sharp,
 * JPEG quality 75 / PNG resample) before the browser ever decodes it.
 * Measured on 2026-09-27, live vs clone (dev server):
 *
 *  - the login page's ArtDeadline badge (listed-with-ADC2.jpg, 212×56 at
 *    1:1 scale): the clone's optimized copy rendered ±1-3 RGB drift across
 *    the whole badge (0.33% of the mobile login capture, concentrated
 *    y403-450) and ±12 on the anti-aliased glyph edges — a full-page
 *    resample of a file that should decode byte-for-byte;
 *  - the header AST logo (ast_logo_horizontal_cropped.png, 1068×269
 *    intrinsic, rendered 159×40 at mobile): the optimizer served it at
 *    w=3840&q=75 — a DOUBLE resample (optimizer → browser) against the
 *    live's single decode of the original PNG, visible as the y0-79 band
 *    (2.4%) on EVERY desktop capture;
 *  - the dashboard's Studio Spotlight portrait (portrait-01.jpg, 56×56 at
 *    1:1): w=128&q=75 re-encode, the y722-802 band (2.5%) on the desktop
 *    dashboard capture.
 *
 * The repo's OTHER image usages (project/supply photos, the inspiration
 * feed artwork, the detail panels) already carry `unoptimized` — that is
 * the established contract (ADR-06 for data-URL photos; measured parity
 * for the feed). These three static-asset usages were the stragglers.
 *
 * `unoptimized` keeps next/image's layout attributes (width/height →
 * aspect-ratio box, no CLS) while serving the original file — the exact
 * behavior of the live's `<img>` tags. Do NOT "optimize" these images;
 * byte-identity with the live's CDN assets is the contract.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const libDir = dirname(fileURLToPath(import.meta.url));

function read(relative: string): string {
  return readFileSync(join(libDir, relative), "utf8");
}

describe("static-asset image pins (r28: no optimizer re-encode)", () => {
  it("serves the login ArtDeadline badge from the original bytes", () => {
    const login = read("../components/studio/login-screen.tsx");
    const usage = login.match(
      /<Image\s+src="\/assets\/listed-with-ADC2\.jpg"[\s\S]*?\/>/,
    )?.[0];
    expect(usage).toBeDefined();
    expect(usage).toContain("unoptimized");
    // The r8 intrinsic-dimension contract stays (280×80 declared, the
    // h-auto/max-h-20 classes size the rendered box).
    expect(usage).toContain("width={280}");
    expect(usage).toContain("height={80}");
  });

  it("serves the dashboard Studio Spotlight portrait from the original bytes", () => {
    const dashboard = read("../components/studio/dashboard-view.tsx");
    const usage = dashboard.match(
      /<Image\s+src="\/assets\/portrait-01\.jpg"[\s\S]*?\/>/,
    )?.[0];
    expect(usage).toBeDefined();
    expect(usage).toContain("unoptimized");
    expect(usage).toContain("width={56}");
    expect(usage).toContain("height={56}");
  });

  it("serves the header AST logo from the original bytes", () => {
    const app = read("../components/studio/studio-app.tsx");
    const usage = app.match(
      /<Image\s+src="\/assets\/ast_logo_horizontal_cropped\.png"[\s\S]*?\/>/,
    )?.[0];
    expect(usage).toBeDefined();
    expect(usage).toContain("unoptimized");
    // The r8 logo contract: intrinsic 1068×269 + priority + the responsive
    // height classes, NO inline style.
    expect(usage).toContain("width={1068}");
    expect(usage).toContain("height={269}");
    expect(usage).toContain("priority");
    expect(usage).toContain("h-10 md:h-12 lg:h-14 w-auto max-w-[320px] object-contain");
    expect(usage).not.toMatch(/style=/);
  });
});
