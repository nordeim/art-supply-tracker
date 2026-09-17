import { describe, expect, it } from "vitest";

import {
  buildExportPayload,
  normalizeImportPayload,
  resolveImportedAssignments,
} from "@/lib/export-payload";

import type { ProjectDto, SupplyDto } from "@/lib/dto";

const NOW = new Date("2026-09-16T12:00:00.000Z").getTime();

function project(overrides: Partial<ProjectDto> = {}): ProjectDto {
  return {
    id: "p1",
    name: "Exhibition Series",
    status: "planned",
    budget: 250,
    notes: "gallery prep",
    photos: ["data:image/jpeg;base64,QUJD"],
    createdAt: new Date(NOW - 60_000).toISOString(),
    updatedAt: new Date(NOW - 30_000).toISOString(),
    ...overrides,
  };
}

function supply(overrides: Partial<SupplyDto> = {}): SupplyDto {
  return {
    id: "s1",
    name: "Palette Knife Set",
    category: "Brush",
    subcategory: "Palette knives",
    quantity: "2",
    condition: "low",
    location: "Drawer 2",
    notes: null,
    barcode: "12345",
    photo: "data:image/jpeg;base64,REVG",
    assignedProjectId: "p1",
    createdAt: new Date(NOW - 60_000).toISOString(),
    updatedAt: new Date(NOW - 30_000).toISOString(),
    ...overrides,
  };
}

describe("buildExportPayload", () => {
  it("emits the live app's payload shape", () => {
    const payload = buildExportPayload([project()], [supply()], NOW);

    expect(payload.app).toBe("AST Studio");
    expect(payload.version).toBe(1);
    expect(typeof payload.exportedAt).toBe("string");

    const p = payload.projects[0];
    expect(p).toMatchObject({
      id: "p1",
      title: "Exhibition Series", // live field name, not "name"
      status: "planned",
      notes: "gallery prep",
      budget: 250,
      isNew: true,
      coverImageUrl: "data:image/jpeg;base64,QUJD",
      supplyIds: ["s1"], // derived from supply.assignedProjectId
    });
    expect(Array.isArray(p.imageKeys)).toBe(true);
    expect(Array.isArray(p.imagePaths)).toBe(true);
    expect(Array.isArray(p.images)).toBe(true);
    expect(p.images).toEqual(["data:image/jpeg;base64,QUJD"]);

    const s = payload.supplies[0];
    expect(s).toMatchObject({
      id: "s1",
      name: "Palette Knife Set",
      category: "Brush",
      subcategory: "Palette knives", // live field name, not "type"
      status: "low",
      barcode: "12345",
      quantityValue: 2,
      quantity: 2,
      qty: 2,
      image: "data:image/jpeg;base64,REVG",
      isNew: true,
    });
    expect(Array.isArray(s.tags)).toBe(true);
    expect(Array.isArray(s.usedInProjectIds)).toBe(true);
  });

  it("omits supply status when ok (mirrors the live export)", () => {
    const payload = buildExportPayload(
      [],
      [supply({ condition: "ok", id: "s-ok" })],
      NOW,
    );
    expect(payload.supplies[0].status).toBeUndefined();
  });

  it("marks old items as not new", () => {
    const payload = buildExportPayload(
      [project({ createdAt: new Date(NOW - 40 * 24 * 60 * 60 * 1000).toISOString() })],
      [],
      NOW,
    );
    expect(payload.projects[0].isNew).toBe(false);
  });

  it("carries unassigned supplies with empty relation arrays", () => {
    const payload = buildExportPayload(
      [project({ id: "px" })],
      [supply({ id: "sx", assignedProjectId: null })],
      NOW,
    );
    expect(payload.projects[0].supplyIds).toEqual([]);
    expect(payload.supplies[0].usedInProjectIds).toEqual([]);
  });

  it("emits empty strings for unset budget and barcode (live export behavior)", () => {
    // The live app's in-memory model defaults both to "" (its create path
    // does `budget: e.budget ?? ''`), and a fresh live export captured
    // 2026-09-17 shows `"budget": ""` / `"barcode": ""` — not null.
    const payload = buildExportPayload(
      [project({ budget: null })],
      [supply({ barcode: null })],
      NOW,
    );
    expect(payload.projects[0].budget).toBe("");
    expect(payload.supplies[0].barcode).toBe("");
  });

  it("emits the live supply field order including imageUrl", () => {
    // Live exports carry `imageUrl: null` between imageKey and createdAt;
    // the clone omits storage-backed owner (no equivalent — privacy) but
    // keeps every other field the live importer maps.
    const payload = buildExportPayload([], [supply()], NOW);
    const s = payload.supplies[0] as unknown as Record<string, unknown>;
    expect(Object.keys(s)).toEqual([
      "id",
      "name",
      "category",
      "subcategory",
      "itemType",
      "unit",
      "barcode",
      "tags",
      "quantityValue",
      "quantity",
      "location",
      "notes",
      "imageKey",
      "imageUrl",
      "createdAt",
      "updatedAt",
      "usedInProjectIds",
      "qty",
      "image",
      "status",
      "isNew",
    ]);
    expect(s.imageUrl).toBeNull();
  });
});

describe("normalizeImportPayload", () => {
  it("passes through a live-shaped payload", () => {
    const live = {
      app: "AST Studio",
      version: 1,
      projects: [
        {
          id: "p1",
          title: "Live project",
          status: "in-progress",
          budget: 100,
          supplyIds: ["s1"],
          images: ["data:image/jpeg;base64,QUJD"],
        },
      ],
      supplies: [
        {
          id: "s1",
          name: "Live supply",
          category: "Paint",
          subcategory: "Gouache",
          quantity: 1.5,
          status: "critical",
          barcode: "BC1",
          location: "Shelf A",
          notes: "note",
          image: "data:image/jpeg;base64,REVG",
        },
      ],
    };
    const normalized = normalizeImportPayload(live, NOW);
    expect(normalized).not.toBeNull();
    if (!normalized) return;

    expect(normalized.projects[0]).toMatchObject({
      name: "Live project",
      status: "in-progress",
      budget: 100,
      photos: ["data:image/jpeg;base64,QUJD"],
    });
    expect(normalized.supplies[0]).toMatchObject({
      name: "Live supply",
      category: "Paint",
      subcategory: "Gouache",
      quantity: "1.5",
      condition: "critical",
      barcode: "BC1",
      location: "Shelf A",
      notes: "note",
      photo: "data:image/jpeg;base64,REVG",
    });
    // The live project→supplyIds relation becomes a positional marker that
    // the import action resolves against the freshly created project rows.
    expect(normalized.supplies[0].assignedProjectId).toBe("__imported__0");

    const resolved = normalizeImportPayload(live, NOW);
    if (!resolved) throw new Error("re-normalize failed");
    resolveImportedAssignments(resolved, ["new-p1"]);
    expect(resolved.supplies[0].assignedProjectId).toBe("new-p1");
  });

  it("maps legacy clone exports onto the same normalized shape", () => {
    const legacy = {
      app: "AST Studio",
      version: 1,
      projects: [
        {
          id: "old-p",
          name: "Legacy project",
          status: "planned",
          budget: 20,
          photos: ["data:image/jpeg;base64,QUJD"],
        },
      ],
      supplies: [
        {
          id: "old-s",
          name: "Legacy supply",
          category: "brushes-tools",
          type: "watercolor",
          quantity: "1/2",
          condition: "critical-out",
          barcode: "X",
          assignedProjectId: "old-p",
        },
      ],
    };
    const normalized = normalizeImportPayload(legacy, NOW);
    expect(normalized).not.toBeNull();
    if (!normalized) return;

    expect(normalized.projects[0].name).toBe("Legacy project");
    // Legacy ids are re-keyed, so assignment is preserved via re-mapping
    expect(normalized.supplies[0].assignedProjectId).toBe("__imported__0");
    expect(normalized.supplies[0]).toMatchObject({
      name: "Legacy supply",
      category: "Brush", // mapped from brushes-tools
      subcategory: "Watercolor", // mapped from lowercase paint value
      quantity: "1/2",
      condition: "critical", // mapped from critical-out
    });
  });

  it("accepts live exports whose project ids reference supplies by supplyIds", () => {
    const live = {
      app: "AST Studio",
      version: 1,
      projects: [{ id: "pp", title: "P", status: "planned", supplyIds: ["aa", "bb"] }],
      supplies: [
        { id: "aa", name: "A", category: "Paint", quantity: 1 },
        { id: "bb", name: "B", category: "Other", quantity: 2 },
      ],
    };
    const normalized = normalizeImportPayload(live, NOW);
    if (!normalized) throw new Error("normalization failed");
    const a = normalized.supplies.find((s) => s.name === "A");
    const b = normalized.supplies.find((s) => s.name === "B");
    expect(a?.assignedProjectId).toBe("__imported__0");
    expect(b?.assignedProjectId).toBe("__imported__0");

    resolveImportedAssignments(normalized, ["created-pp"]);
    expect(a?.assignedProjectId).toBe("created-pp");
    expect(b?.assignedProjectId).toBe("created-pp");
  });

  it("returns null for non-object input", () => {
    expect(normalizeImportPayload("nope", NOW)).toBeNull();
    expect(normalizeImportPayload(null, NOW)).toBeNull();
  });

  it("returns null when the app marker does not match", () => {
    expect(
      normalizeImportPayload({ app: "Other", version: 1, projects: [], supplies: [] }, NOW),
    ).toBeNull();
  });
});
