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

describe("seed fidelity — the r35 inspiration gallery + citation links", () => {
  it("seeds Kevin Lewis's five-artwork gallery (the live's thumb strip)", () => {
    // Measured on the live 2026-09-29: the spotlight panel renders five
    // artwork thumbs (artwork-01..04 + studio-01), byte-identical to the
    // repo's public/assets copies (md5-verified against the live CDN).
    expect(seed).toContain('gallery: [');
    expect(seed).toContain('"/assets/artwork-01.jpg"');
    expect(seed).toContain('"/assets/artwork-02.jpg"');
    expect(seed).toContain('"/assets/artwork-03.jpg"');
    expect(seed).toContain('"/assets/artwork-04.jpg"');
    expect(seed).toContain('"/assets/studio-01.jpeg"');
  });

  it("seeds Kim Wyatt's single-artwork gallery (the live's external wixstatic image)", () => {
    expect(seed).toContain("static.wixstatic.com");
  });

  it("seeds the spotlight galleries as {url, alt} objects with the live's per-artwork alts (r36)", () => {
    // The live's gallery data is {url, alt} objects (bundle): Kevin's
    // five carry "Kevin Lewis — artwork 1".."Kevin Lewis's studio"; Kim's
    // single artwork carries "Liberty With Mask by Kim Wyatt".
    expect(seed).toContain('alt: "Kevin Lewis — artwork 1"');
    expect(seed).toContain('alt: "Kevin Lewis — artwork 2"');
    expect(seed).toContain("alt: \"Kevin Lewis's studio\"");
    expect(seed).toContain('alt: "Liberty With Mask by Kim Wyatt"');
  });

  it("seeds the spotlights' per-tag colored pill classes (r36 — the live's tagColors data)", () => {
    // The live's data carries parallel tagColors arrays (bundle): Kevin
    // pink/purple/turquoise /20; Kim turquoise/20, lavender/20, and
    // faint-text-on-lavender/10. Hyphenated here — the clone's token
    // spelling family (compiles the same values).
    expect(seed).toContain('"text-ast-pink bg-ast-pink/20"');
    expect(seed).toContain('"text-ast-purple bg-ast-purple/20"');
    expect(seed).toContain('"text-ast-turquoise bg-ast-turquoise/20"');
    expect(seed).toContain('"text-ast-lavender bg-ast-lavender/20"');
    expect(seed).toContain('"text-ast-faint bg-ast-lavender/10"');
  });

  it("seeds Kim's website as the live's full URL with the bare label (r36)", () => {
    // The live's data: website `https://www.kimwyatt.art/` +
    // websiteLabel `kimwyatt.art` — the JSX appends the arrow. The old
    // seed carried the arrow inside the label and the bare host as the
    // target (href https://kimwyatt.art — no www).
    expect(seed).toContain('linkUrl: "https://www.kimwyatt.art/"');
    expect(seed).toContain('linkLabel: "kimwyatt.art"');
    expect(seed).not.toContain("kimwyatt.art →");
  });

  it("seeds the live's citation links (the underlined external hrefs)", () => {
    expect(seed).toContain(
      "citationUrl: \"https://www.artic.edu/artworks/111442/the-child-s-bath\"",
    );
    expect(seed).toContain(
      "citationUrl: \"https://www.rijksmuseum.nl/en/collection/SK-C-5\"",
    );
    expect(seed).toContain(
      "citationUrl: \"https://www.musee-orsay.fr/en/artworks/la-classe-de-danse-1656\"",
    );
    expect(seed).toContain(
      "nupress.northwestern.edu/9780810108202/the-diary-and-letters-of-kaethe-kollwitz/",
    );
    expect(seed).toContain(
      "citationUrl: \"https://www.moma.org/collection/works/37347\"",
    );
  });
});

describe("seed fidelity — the r37 timeline artwork images + quote dates", () => {
  it("seeds the live's working wikimedia image for the Van Gogh entry (r37)", () => {
    // Measured on the live r37: the Van Gogh timeline tile (2026-05-31)
    // renders an IMG thumb from this exact URL (naturalWidth 1280) and
    // its history panel renders the artwork image (h 565 vs the
    // image-less 490) instead of the rights notice.
    expect(seed).toContain(
      'imageUrl:\n        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",',
    );
  });

  it("seeds the live's working wikimedia image for the Monet entry (r37)", () => {
    // The Monet tile (2026-06-17) renders an IMG thumb from this URL
    // (naturalWidth 5773) — the other six timeline entries render the
    // gradient fallback on the live (no image_url).
    expect(seed).toContain(
      'imageUrl:\n        "https://upload.wikimedia.org/wikipedia/commons/5/59/Monet_-_Impression%2C_Sunrise.jpg",',
    );
  });

  it("seeds the live's image_alt_texts for the two artwork images (r37)", () => {
    // The live's img alt (its image_alt_text field, verbatim).
    expect(seed).toContain(
      'imageAlt:\n        "The Starry Night by Vincent van Gogh, 1889, oil on canvas, 73.7 x 92.1 cm, Museum of Modern Art, New York"',
    );
    expect(seed).toContain(
      'imageAlt:\n        "Impression, Sunrise by Claude Monet, 1872, oil on canvas, 48 x 63 cm, Musée Marmottan Monet, Paris"',
    );
  });

  it("seeds the four quote dates (r37 — the live's quote tile keys are quote-<date>)", () => {
    // The live's quote entries carry dates; the Feed's quote tiles key
    // on "quote-<date>" (bundle: let t = `quote-${e.date}`). The clone's
    // quotes need the same dates: Cassatt 2026-07-26, Degas 2026-07-19,
    // Kollwitz 2026-07-13, Klee 2026-06-27 (the seed's insertion order
    // already matches the live's date-desc tile order).
    expect(seed).toMatch(
      /type: "artist_quote",\s*\n\s*title: "I am independent! I can live alone and I love to work\.",\s*\n\s*author: "Mary Cassatt",\s*\n\s*date: "2026-07-26",/,
    );
    expect(seed).toMatch(
      /type: "artist_quote",\s*\n\s*title: "Painting is easy when you don't know how, but very difficult when you do\.",\s*\n\s*author: "Edgar Degas",\s*\n\s*date: "2026-07-19",/,
    );
    expect(seed).toMatch(
      /type: "artist_quote",\s*\n\s*title: "I want to do something that will have repercussions in my time\.",\s*\n\s*author: "Käthe Kollwitz",\s*\n\s*date: "2026-07-13",/,
    );
    expect(seed).toMatch(
      /type: "artist_quote",\s*\n\s*title: "A drawing is simply a line going for a walk\.",\s*\n\s*author: "Paul Klee",\s*\n\s*date: "2026-06-27",/,
    );
  });

  it("keeps the other six timeline entries imageless (the live renders their gradient fallbacks)", () => {
    // Only Van Gogh + Monet carry image_urls on the live; Carmen
    // Herrera, Courbet, Hopper, Guerrilla Girls, Kollwitz, and
    // Rembrandt render the gradient fallback thumbs + the rights
    // notice in their panels. The seed must not grow extra images.
    const inline = seed.match(/imageUrl: "\//g) ?? [];
    const wrapped = seed.match(/imageUrl:\n/g) ?? [];
    // Kim Wyatt + Kevin Lewis (spotlights, inline /assets paths) +
    // Van Gogh + Monet (wikimedia URLs, wrapped by prettier) = 4 entry
    // occurrences total — the DB write's `imageUrl: e.imageUrl ?? null`
    // line is not a seed entry and must not be counted.
    expect(inline).toHaveLength(2);
    expect(wrapped).toHaveLength(2);
  });
});
