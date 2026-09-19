/**
 * Export/Import payload mapping — the wire format contract.
 *
 * The original Art Supply Tracker app exports a specific JSON shape
 * (captured verbatim from studiobeta.artsupplytracker.com on 2026-09-16):
 *
 *   projects: [{ id, title, description, status, notes, coverImageUrl,
 *                imageKeys, supplyIds, createdAt, updatedAt, images,
 *                imagePaths, budget, isNew }]
 *   supplies: [{ id, name, category, subcategory, itemType, unit, barcode,
 *                tags, quantityValue, quantity, location, notes, imageKey,
 *                createdAt, updatedAt, usedInProjectIds, qty, image,
 *                status, isNew }]
 *
 * `buildExportPayload` emits exactly that shape from our DTOs, and
 * `normalizeImportPayload` accepts BOTH live-app exports and the clone's
 * earlier legacy shape, producing a common normalized form the import
 * action stores. Relation direction matches the live app: the project
 * carries `supplyIds`; internally we store `Supply.assignedProjectId`
 * (single membership — the supply modal's "Assign to Project" select is
 * single-valued there too) and derive `supplyIds` on export.
 */
import type { ProjectDto, SupplyDto } from "@/lib/dto";
import type { ExportPayload } from "@/lib/dto";
import { isNewItem, parseQuantityValue } from "@/lib/studio-domain";

/** What the import action actually stores after normalization. */
export interface NormalizedImportProject {
  name: string;
  status: string;
  budget: number | null;
  notes: string | null;
  photos: string[];
}

export interface NormalizedImportSupply {
  name: string;
  category: string;
  subcategory: string | null;
  quantity: string;
  condition: string | null;
  location: string | null;
  notes: string | null;
  barcode: string | null;
  photo: string | null;
  assignedProjectId: string | null;
}

export interface NormalizedImportPayload {
  projects: NormalizedImportProject[];
  supplies: NormalizedImportSupply[];
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function toExportedProject(project: ProjectDto, supplyIds: string[], now: number) {
  return {
    id: project.id,
    title: project.name,
    description: null,
    status: project.status,
    notes: project.notes,
    coverImageUrl: project.photos[0] ?? null,
    imageKeys: [] as string[],
    supplyIds,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    images: project.photos,
    imagePaths: [] as string[],
    // The live app's in-memory model defaults budget to "" (its create
    // path does `budget: e.budget ?? ''`); a fresh live export captured
    // 2026-09-17 shows `"budget": ""` for unset budgets.
    budget: project.budget ?? ("" as const),
    isNew: isNewItem(project.createdAt, now),
  };
}

function toExportedSupply(supply: SupplyDto, now: number) {
  const quantityValue = parseQuantityValue(supply.quantity);
  // The live's `quantity` slot is the PLAIN Number() parse (no fraction
  // support): "2" -> 2, "1/2" -> null, "" -> null (measured on live
  // exports 2026-09-19). `quantityValue` (and `qty` below) use the
  // fraction-aware parse instead.
  const plain = supply.quantity.trim() === "" ? null : Number(supply.quantity);
  const quantity = Number.isFinite(plain) ? plain : null;
  // `qty` mirrors the live's in-memory value: the raw "" when the quantity
  // is empty, the parsed number otherwise.
  const qty = supply.quantity === "" ? ("" as const) : quantityValue;
  return {
    id: supply.id,
    name: supply.name,
    category: supply.category,
    subcategory: supply.subcategory,
    itemType: null,
    unit: null,
    barcode: supply.barcode ?? "",
    tags: [] as string[],
    quantityValue,
    quantity,
    location: supply.location,
    notes: supply.notes,
    imageKey: null,
    // The live export's storage-backed URL slot — always null for the
    // clone (photos are inline data URLs, carried by `image`).
    imageUrl: null,
    createdAt: supply.createdAt,
    updatedAt: supply.updatedAt,
    usedInProjectIds: [] as string[],
    qty,
    image: supply.photo,
    // The live emits `status` whenever one is stored — including an
    // explicit "ok" saved through the edit panel; an ABSENT status
    // (null, the create modal's inert-select result) is omitted
    // (measured on live exports 2026-09-19).
    ...(supply.condition !== null ? { status: supply.condition } : {}),
    isNew: isNewItem(supply.createdAt, now),
  };
}

export function buildExportPayload(
  projects: ProjectDto[],
  supplies: SupplyDto[],
  now: number = Date.now(),
): ExportPayload {
  return {
    app: "AST Studio",
    exportedAt: new Date(now).toISOString(),
    version: 1,
    projects: projects.map((project) =>
      toExportedProject(
        project,
        supplies.filter((s) => s.assignedProjectId === project.id).map((s) => s.id),
        now,
      ),
    ),
    supplies: supplies.map((supply) => toExportedSupply(supply, now)),
  };
}

// ---------------------------------------------------------------------------
// Import normalization
// ---------------------------------------------------------------------------

/** Legacy clone category tokens → live category tokens. */
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  paint: "Paint",
  "brushes-tools": "Brush",
  pastels: "Pastel",
  paper: "Paper",
  "canvas-board": "Canvas",
  mediums: "Medium",
  other: "Other",
};

/** Legacy clone condition tokens → live tokens. */
const LEGACY_CONDITION_MAP: Record<string, string> = {
  ok: "ok",
  low: "low",
  "critical-out": "critical",
  critical: "critical",
};

/** Legacy lowercase paint types → live capitalized values. */
const LEGACY_PAINT_TYPE_MAP: Record<string, string> = {
  watercolor: "Watercolor",
  acrylic: "Acrylic",
  oil: "Oil",
  gouache: "Gouache",
  ink: "Ink",
  encaustic: "Encaustic",
};

function normalizeCategory(raw: unknown): string {
  if (typeof raw !== "string" || raw === "") return "Other";
  return LEGACY_CATEGORY_MAP[raw] ?? raw;
}

function normalizeCondition(raw: unknown): string | null {
  if (typeof raw !== "string" || raw === "") return null;
  // Known tokens (incl. the legacy clone's "critical-out") map through;
  // unknown tokens pass through raw so the normalized-import schema gate
  // rejects them (the documented refusal contract).
  return LEGACY_CONDITION_MAP[raw] ?? raw;
}

function normalizeSubcategory(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "none" || trimmed === "__other__") return null;
  return LEGACY_PAINT_TYPE_MAP[trimmed] ?? trimmed;
}

function normalizeQuantity(raw: unknown): string {
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  // "" round-trips: the live stores empty quantities and its exports carry
  // qty:"" — importing one must restore the empty string, not "1"
  // (measured 2026-09-19 via a live import round-trip).
  if (typeof raw === "string" && raw.trim() !== "") return raw.trim();
  if (raw === "") return "";
  return "1";
}

function normalizeText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizePhotos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is string => typeof p === "string" && p.startsWith("data:"));
}

function normalizeImportProject(raw: Record<string, unknown>): NormalizedImportProject {
  const photos = normalizePhotos(raw.images).length
    ? normalizePhotos(raw.images)
    : normalizePhotos(raw.photos);
  const budget = typeof raw.budget === "number" && Number.isFinite(raw.budget) ? raw.budget : null;
  return {
    // Live exports use `title`; the legacy clone used `name`.
    name: normalizeText(raw.title) ?? normalizeText(raw.name) ?? "Untitled project",
    status: typeof raw.status === "string" && raw.status !== "" ? raw.status : "planned",
    budget,
    notes: normalizeText(raw.notes) ?? normalizeText(raw.description),
    photos,
  };
}

function normalizeImportSupply(raw: Record<string, unknown>): NormalizedImportSupply {
  const photo =
    (typeof raw.image === "string" && raw.image.startsWith("data:") ? raw.image : null) ??
    (typeof raw.photo === "string" && raw.photo.startsWith("data:") ? raw.photo : null);
  return {
    name: normalizeText(raw.name) ?? "Untitled supply",
    category: normalizeCategory(raw.category),
    subcategory: normalizeSubcategory(raw.subcategory ?? raw.type),
    quantity: normalizeQuantity(raw.quantityValue ?? raw.quantity ?? raw.qty),
    condition: normalizeCondition(raw.status ?? raw.condition),
    location: normalizeText(raw.location),
    notes: normalizeText(raw.notes),
    barcode: normalizeText(raw.barcode),
    photo,
    assignedProjectId: null, // resolved after projects are keyed (below)
  };
}

export function normalizeImportPayload(
  input: unknown,
  _now: number = Date.now(),
): NormalizedImportPayload | null {
  if (typeof input !== "object" || input === null) return null;
  const root = input as Record<string, unknown>;
  if (root.app !== "AST Studio") return null;

  const rawProjects = Array.isArray(root.projects) ? root.projects : [];
  const rawSupplies = Array.isArray(root.supplies) ? root.supplies : [];

  const projects = rawProjects
    .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
    .map(normalizeImportProject);

  const supplies = rawSupplies
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .map(normalizeImportSupply);

  // Resolve the live app's project→supplyIds relation into our internal
  // supply→assignedProjectId. Imported rows get fresh ids at write time, so
  // old ids are mapped positionally: the live payload's id fields reference
  // each other, not our new rows. `isNew`, `createdAt`, and `updatedAt` are
  // intentionally ignored — imported items are re-created fresh (the live
  // app behaves the same way).
  const idToIndex = new Map<string, number>();
  rawSupplies.forEach((s, index) => {
    if (typeof s === "object" && s !== null) {
      const id = (s as Record<string, unknown>).id;
      if (typeof id === "string" && id !== "") idToIndex.set(id, index);
    }
  });

  rawProjects.forEach((p, projectIndex) => {
    if (typeof p !== "object" || p === null) return;
    const supplyIds = (p as Record<string, unknown>).supplyIds;
    if (!Array.isArray(supplyIds)) return;
    for (const supplyId of supplyIds) {
      if (typeof supplyId !== "string") continue;
      const supplyIndex = idToIndex.get(supplyId);
      if (supplyIndex !== undefined && projects[projectIndex]) {
        supplies[supplyIndex].assignedProjectId = `__imported__${projectIndex}`;
      }
    }
  });

  // Legacy payloads may carry supply→assignedProjectId references instead.
  rawSupplies.forEach((s, index) => {
    if (typeof s !== "object" || s === null) return;
    const legacyId = (s as Record<string, unknown>).assignedProjectId;
    if (typeof legacyId !== "string" || legacyId === "") return;
    if (supplies[index].assignedProjectId) return; // live supplyIds wins
    const projectIndex = rawProjects.findIndex(
      (p) => typeof p === "object" && p !== null && (p as Record<string, unknown>).id === legacyId,
    );
    if (projectIndex !== -1) supplies[index].assignedProjectId = `__imported__${projectIndex}`;
  });

  // Swap the positional markers for the normalized projects' eventual ids —
  // the import action assigns ids; here we emit index markers and let the
  // caller remap. To keep this module pure, we instead return the marker
  // scheme and document that studio.ts resolves `__imported__<i>`.
  return { projects, supplies };
}

/** Resolve `__imported__<index>` markers against freshly created project ids. */
export function resolveImportedAssignments(
  payload: NormalizedImportPayload,
  createdProjectIds: string[],
): void {
  for (const supply of payload.supplies) {
    if (supply.assignedProjectId?.startsWith("__imported__")) {
      const index = Number(supply.assignedProjectId.slice("__imported__".length));
      supply.assignedProjectId = createdProjectIds[index] ?? null;
    }
  }
}
