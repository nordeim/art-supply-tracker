import { describe, expect, it } from "vitest";

import {
  deriveDisplayName,
  importPayloadSchema,
  normalizedImportPayloadSchema,
  projectInputSchema,
  signUpSchema,
  supplyInputSchema,
} from "@/lib/validation";

/**
 * Boundary-contract tests: the schemas must accept everything the live app
 * and our own client produce, and reject the shapes that would corrupt data.
 */

const smallDataUrl = `data:image/jpeg;base64,${"A".repeat(400)}`;
const realPhotoDataUrl = `data:image/jpeg;base64,${"A".repeat(300 * 1024)}`; // client cap
const oversizeDataUrl = `data:image/jpeg;base64,${"A".repeat(460_000)}`; // above server cap

describe("projectInputSchema", () => {
  it("accepts a project with a real (300 KB) photo data URL", () => {
    const parsed = projectInputSchema.safeParse({
      name: "Summer Exhibition Series",
      status: "planned",
      budget: 250,
      notes: "Notes",
      photos: [realPhotoDataUrl],
    });
    expect(parsed.success).toBe(true);
  });

  it("still accepts the legacy modal payload shape", () => {
    const parsed = projectInputSchema.safeParse({
      name: "Legacy project",
      status: "in-progress",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.name).toBe("Legacy project");
  });

  it("rejects photo data URLs above the server cap", () => {
    const parsed = projectInputSchema.safeParse({
      name: "Too big",
      photos: [oversizeDataUrl],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects more than 10 photos", () => {
    const parsed = projectInputSchema.safeParse({
      name: "Too many",
      photos: Array.from({ length: 11 }, () => smallDataUrl),
    });
    expect(parsed.success).toBe(false);
  });

  it("defaults status to planned and trims the name", () => {
    const parsed = projectInputSchema.safeParse({ name: "  Trimmed  " });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Trimmed");
      expect(parsed.data.status).toBe("planned");
    }
  });
});

describe("supplyInputSchema", () => {
  it("accepts the live vocabulary (category Paint, subcategory Watercolor)", () => {
    const parsed = supplyInputSchema.safeParse({
      name: "Cobalt Blue",
      category: "Paint",
      subcategory: "Watercolor",
      quantity: "2",
      condition: "ok",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a Brush supply with its subcategory", () => {
    const parsed = supplyInputSchema.safeParse({
      name: "Palette Knife Set",
      category: "Brush",
      subcategory: "Palette knives",
      quantity: "1",
      condition: "low",
    });
    expect(parsed.success).toBe(true);
  });

  it("normalizes the picker's None and Other/Custom sentinels to undefined", () => {
    for (const sentinel of ["", "__other__", "none"]) {
      const parsed = supplyInputSchema.safeParse({
        name: "S",
        category: "Paint",
        subcategory: sentinel,
        quantity: "1",
      });
      expect(parsed.success, `sentinel ${sentinel}`).toBe(true);
      if (parsed.success) expect(parsed.data.subcategory).toBeUndefined();
    }
  });

  it("accepts the critical condition value", () => {
    const parsed = supplyInputSchema.safeParse({
      name: "S",
      category: "Paint",
      quantity: "1",
      condition: "critical",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a custom subcategory from the Other/Custom flow (live parity)", () => {
    // The live app's __other__ flow stores free-form custom text (its save
    // path does `subcategory === '__other__' ? custom.trim() || '' : value`),
    // and its backend has no vocabulary check — the pickers are the guard.
    const parsed = supplyInputSchema.safeParse({
      name: "Dry Brush Kit",
      category: "Brush",
      subcategory: "Dry brush",
      quantity: "1",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.subcategory).toBe("Dry brush");
  });

  it("tolerates cross-list subcategory values (the boundary cannot tell custom text from them)", () => {
    // The live app accepts any string here; the category-scoping is enforced
    // by the pickers, not the backend. The schema keeps type/length/sentinel
    // discipline only.
    const parsed = supplyInputSchema.safeParse({
      name: "Wrong combo",
      category: "Paper",
      subcategory: "Palette knives", // a Brush subcategory
      quantity: "1",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown categories", () => {
    const parsed = supplyInputSchema.safeParse({
      name: "S",
      category: "brushes-tools", // legacy value — no longer valid at the boundary
      quantity: "1",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a supply photo data URL at the client cap", () => {
    const parsed = supplyInputSchema.safeParse({
      name: "With photo",
      category: "Paint",
      quantity: "1",
      photo: realPhotoDataUrl,
    });
    expect(parsed.success).toBe(true);
  });
});

describe("importPayloadSchema", () => {
  it("accepts a live-app export payload verbatim", () => {
    const parsed = importPayloadSchema.safeParse({
      app: "AST Studio",
      version: 1,
      projects: [
        {
          id: "c69412c2-390b-4895-bd48-8849f30ee496",
          title: "ZZTEST Exhibition Series",
          description: null,
          status: "planned",
          notes: null,
          coverImageUrl: null,
          imageKeys: [],
          supplyIds: ["825c1b82-99f0-45f6-b844-3dec86c4ffd9"],
          createdAt: "2026-09-16T05:00:37.166Z",
          updatedAt: "2026-09-16T05:00:37.166Z",
          images: [],
          imagePaths: [],
          budget: 250,
          isNew: true,
        },
      ],
      supplies: [
        {
          id: "825c1b82-99f0-45f6-b844-3dec86c4ffd9",
          name: "ZZTEST Palette Knife Set",
          category: "Brush",
          subcategory: "Palette knives",
          itemType: null,
          unit: null,
          barcode: "",
          tags: [],
          quantityValue: 2,
          quantity: 2,
          location: null,
          notes: null,
          imageKey: null,
          createdAt: "2026-09-16T04:55:38.495Z",
          updatedAt: "2026-09-16T05:02:57.395Z",
          usedInProjectIds: [],
          qty: 2,
          image: null,
          isNew: true,
          status: "low",
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a live supply that omits status (the ok case)", () => {
    const parsed = importPayloadSchema.safeParse({
      app: "AST Studio",
      version: 1,
      projects: [],
      supplies: [
        {
          name: "No status field",
          category: "Paint",
          subcategory: "Watercolor",
          quantity: 3,
          qty: 3,
          quantityValue: 3,
          tags: [],
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("keeps the export/import round-trip shape valid", () => {
    const payload = {
      app: "AST Studio",
      exportedAt: new Date().toISOString(),
      version: 1,
      projects: [
        {
          id: "p1",
          title: "Round trip",
          description: null,
          status: "completed",
          notes: "n",
          coverImageUrl: null,
          imageKeys: [],
          supplyIds: [],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          images: [],
          imagePaths: [],
          budget: 0,
          isNew: false,
        },
      ],
      supplies: [],
    };
    expect(importPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects payloads from other apps", () => {
    const parsed = importPayloadSchema.safeParse({
      app: "Somebody Else",
      version: 1,
      projects: [],
      supplies: [],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("normalizedImportPayloadSchema", () => {
  // A representative normalized payload (what normalizeImportPayload emits for
  // a live-app export after the dialect fold).
  const normalized = {
    projects: [
      {
        name: "Live project",
        status: "in-progress",
        budget: 100,
        notes: null,
        photos: ["data:image/jpeg;base64,QUJD"],
      },
    ],
    supplies: [
      {
        name: "Live supply",
        category: "Brush",
        subcategory: "Palette knives",
        quantity: "2",
        condition: "low",
        location: null,
        notes: null,
        barcode: null,
        photo: null,
        assignedProjectId: "__imported__0",
      },
    ],
  };

  it("accepts a normalized live-app payload", () => {
    expect(normalizedImportPayloadSchema.safeParse(normalized).success).toBe(true);
  });

  it("rejects a supply category outside the vocabulary", () => {
    const parsed = normalizedImportPayloadSchema.safeParse({
      ...normalized,
      supplies: [{ ...normalized.supplies[0], category: "NotACategory" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a project status outside the vocabulary", () => {
    const parsed = normalizedImportPayloadSchema.safeParse({
      ...normalized,
      projects: [{ ...normalized.projects[0], status: "banana" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects more than 500 projects and 1000 supplies", () => {
    const many = (n: number) => Array.from({ length: n }, () => normalized.projects[0]);
    const manySupplies = (n: number) => Array.from({ length: n }, () => normalized.supplies[0]);
    expect(
      normalizedImportPayloadSchema.safeParse({ ...normalized, projects: many(501) }).success,
    ).toBe(false);
    expect(
      normalizedImportPayloadSchema.safeParse({ ...normalized, supplies: manySupplies(1001) })
        .success,
    ).toBe(false);
  });

  it("rejects an oversized photo on the normalized supply", () => {
    const parsed = normalizedImportPayloadSchema.safeParse({
      ...normalized,
      supplies: [
        { ...normalized.supplies[0], photo: `data:image/jpeg;base64,${"A".repeat(400_001)}` },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects more than 10 photos on a normalized project", () => {
    const photos = Array.from({ length: 11 }, () => "data:image/jpeg;base64,QUJD");
    const parsed = normalizedImportPayloadSchema.safeParse({
      ...normalized,
      projects: [{ ...normalized.projects[0], photos }],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("signUpSchema + deriveDisplayName (live Cognito form shape)", () => {
  it("accepts the live's email + password form (no display name required)", () => {
    const parsed = signUpSchema.safeParse({
      email: "artist@example.com",
      password: "StudioDemo2026!",
    });
    expect(parsed.success).toBe(true);
  });

  it("still tolerates a client-supplied display name (back-compat)", () => {
    const parsed = signUpSchema.safeParse({
      email: "artist@example.com",
      password: "StudioDemo2026!",
      displayName: "Named Artist",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.displayName).toBe("Named Artist");
  });

  it("derives the display name from the email local part like the chat username", () => {
    expect(deriveDisplayName("kimsart@gmail.com")).toBe("kimsart");
    expect(deriveDisplayName("Jane.Doe+studio@Example.COM")).toBe("Jane.Doe+studio");
  });

  it("degrades gracefully for malformed emails", () => {
    // Unreachable in practice (emailSchema runs first) — documents the
    // degradation: empty local part falls back to "Artist".
    expect(deriveDisplayName("@localhost")).toBe("Artist");
  });
});
