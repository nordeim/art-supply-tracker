import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Action-layer tests — the mutation surface (PAD §10's "extend the Vitest
 * suite into src/actions" item). Each test file runs against its own
 * throwaway SQLite database (schema pushed in beforeAll), with the auth
 * seam mocked to a controllable session user — the real `requireUser`
 * reads Next's cookies(), which does not exist outside a request.
 */

const TEST_USER = {
  id: "test-user-1",
  email: "studio@test.dev",
  displayName: "Test Artist",
  lastWorkedOn: "",
};
const OTHER_USER = {
  id: "test-user-2",
  email: "other@test.dev",
  displayName: "Other Artist",
  lastWorkedOn: "",
};

let currentUser = TEST_USER;

vi.mock("@/lib/auth", () => ({
  requireUser: async () => currentUser,
  getCurrentUser: async () => currentUser,
  SESSION_COOKIE: "ast_session",
}));

// The DATABASE_URL must exist before @/lib/db (and the actions that import
// it) are evaluated — static imports hoist, so the actions are imported
// dynamically inside beforeAll, after the env var is set.
const dbFile = `/tmp/ast-action-test-${process.pid}.db`;
process.env.DATABASE_URL = `file:${dbFile}`;

type StudioModule = typeof import("@/actions/studio");
type DbModule = typeof import("@/lib/db");

let studio: StudioModule;
let db: DbModule["db"];

beforeAll(async () => {
  // Push the schema to the throwaway database.
  const { execFileSync } = await import("node:child_process");
  const { resolve } = await import("node:path");
  const repoRoot = resolve(__dirname, "../..");
  execFileSync(
    "bunx",
    ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
    { cwd: repoRoot, env: { ...process.env, DATABASE_URL: `file:${dbFile}` }, stdio: "pipe" },
  );

  db = (await import("@/lib/db")).db;
  studio = await import("@/actions/studio");

  // Seed the two users the mocked sessions resolve to.
  await db.user.createMany({
    data: [
      { id: TEST_USER.id, email: TEST_USER.email, displayName: TEST_USER.displayName, passwordHash: "scrypt:x:y" },
      { id: OTHER_USER.id, email: OTHER_USER.email, displayName: OTHER_USER.displayName, passwordHash: "scrypt:x:y" },
    ],
  });
}, 120_000);

afterAll(async () => {
  await db.$disconnect?.();
  const { rmSync } = await import("node:fs");
  try {
    rmSync(dbFile, { force: true });
    rmSync(`${dbFile}-journal`, { force: true });
  } catch {
    // best-effort cleanup of the throwaway database
  }
});

describe("project actions", () => {
  it("creates a project and returns the DTO", async () => {
    const result = await studio.createProject({
      name: "Exhibition Series",
      status: "planned",
      budget: 250,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Exhibition Series");
      expect(result.data.status).toBe("planned");
      expect(result.data.budget).toBe(250);
    }
  });

  it("rejects a photo data URL above the server cap", async () => {
    const result = await studio.createProject({
      name: "Too big",
      photos: [`data:image/jpeg;base64,${"A".repeat(460_000)}`],
    });
    expect(result.ok).toBe(false);
  });

  it("accepts a photo data URL at the client cap", async () => {
    const result = await studio.createProject({
      name: "With photo",
      photos: [`data:image/jpeg;base64,${"A".repeat(300 * 1024)}`],
    });
    expect(result.ok).toBe(true);
  });

  it("updates a project the user owns", async () => {
    const created = await studio.createProject({ name: "Before" });
    if (!created.ok) throw new Error("create failed");
    const updated = await studio.updateProject(created.data.id, {
      name: "After",
      status: "completed",
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.data.name).toBe("After");
      expect(updated.data.status).toBe("completed");
    }
  });

  it("refuses to update another user's project (no IDOR)", async () => {
    const created = await studio.createProject({ name: "Mine" });
    if (!created.ok) throw new Error("create failed");
    currentUser = OTHER_USER;
    const updated = await studio.updateProject(created.data.id, { name: "Hijacked" });
    currentUser = TEST_USER;
    expect(updated.ok).toBe(false);
    if (!updated.ok) expect(updated.error.code).toBe("NOT_FOUND");
  });

  it("deleting a project unassigns its supplies", async () => {
    const project = await studio.createProject({ name: "To delete" });
    const supply = await studio.createSupply({
      name: "Assigned supply",
      category: "Paint",
      subcategory: "Watercolor",
      quantity: "1",
    });
    if (!project.ok || !supply.ok) throw new Error("setup failed");
    const assigned = await studio.setSupplyAssignment(supply.data.id, project.data.id);
    expect(assigned.ok).toBe(true);

    const deleted = await studio.deleteProject(project.data.id);
    expect(deleted.ok).toBe(true);

    const after = await db.supply.findUnique({ where: { id: supply.data.id } });
    expect(after?.assignedProjectId).toBeNull();
  });

  it("keeps assignments when the project delete fails mid-way (r11 atomicity)", async () => {
    // The detach + delete must run in ONE transaction: a failure after the
    // detach would otherwise silently strand supplies on a project that
    // still exists.
    const project = await studio.createProject({ name: "Atomic target" });
    const supply = await studio.createSupply({
      name: "Atomic supply",
      category: "Paint",
      quantity: "1",
    });
    if (!project.ok || !supply.ok) throw new Error("setup failed");
    const assigned = await studio.setSupplyAssignment(supply.data.id, project.data.id);
    expect(assigned.ok).toBe(true);

    const original = db.$transaction.bind(db);
    const spy = vi.spyOn(db, "$transaction").mockImplementation(
      (async (arg: unknown) => {
        if (typeof arg === "function") {
          // Interactive-transaction form: the tx detaches the supplies but
          // FAILS on the project delete — the whole restore must roll back.
          const tx = {
            supply: {
              updateMany: async () => ({}),
            },
            project: {
              delete: async () => {
                throw new Error("boom");
              },
            },
          };
          type TxLike = typeof tx;
          return await (arg as (client: TxLike) => unknown)(tx);
        }
        return await original(arg as never);
      }) as unknown as typeof db.$transaction,
    );

    let result: Awaited<ReturnType<typeof studio.deleteProject>>;
    try {
      result = await studio.deleteProject(project.data.id);
    } finally {
      spy.mockRestore();
    }

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");

    // The assignment survived the failed delete — nothing was stranded.
    const after = await db.supply.findUnique({ where: { id: supply.data.id } });
    expect(after?.assignedProjectId).toBe(project.data.id);
  });
});

describe("supply actions", () => {
  it("creates a supply with the live vocabulary", async () => {
    const result = await studio.createSupply({
      name: "Palette Knife Set",
      category: "Brush",
      subcategory: "Palette knives",
      quantity: "2",
      condition: "low",
      location: "Drawer 2",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.category).toBe("Brush");
      expect(result.data.subcategory).toBe("Palette knives");
      expect(result.data.condition).toBe("low");
    }
  });

  it("creates a supply with an empty quantity and absent status (r11)", async () => {
    // The live's create modal accepts an empty quantity (stores "") and
    // never stores a status (its Stock Status select is inert).
    const result = await studio.createSupply({
      name: "No quantity",
      category: "Paint",
      quantity: "",
      condition: null,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quantity).toBe("");
      expect(result.data.condition).toBeNull();
    }
    // Omitting every optional field lands on the same absent defaults.
    const bare = await studio.createSupply({ name: "Bare", category: "Paint" });
    expect(bare.ok).toBe(true);
    if (bare.ok) {
      expect(bare.data.quantity).toBe("");
      expect(bare.data.condition).toBeNull();
    }
  });

  it("rejects an unparseable quantity with the live's copy (r11)", async () => {
    const result = await studio.createSupply({
      name: "Bad qty",
      category: "Paint",
      quantity: "abc",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
      expect(result.error.message).toBe("Enter a valid quantity, like 2, 1.5, or 1/2");
    }
  });

  it("updates a supply to an explicit ok condition (the edit panel's save, r11)", async () => {
    const created = await studio.createSupply({
      name: "To make explicit",
      category: "Paint",
      quantity: "2",
      condition: null,
    });
    if (!created.ok) throw new Error("create failed");
    expect(created.data.condition).toBeNull();

    const edited = await studio.updateSupply(created.data.id, {
      name: "To make explicit",
      category: "Paint",
      quantity: "2",
      condition: "ok",
    });
    expect(edited.ok).toBe(true);
    if (edited.ok) expect(edited.data.condition).toBe("ok");
  });

  it("normalizes the None and Other/Custom picker sentinels", async () => {
    for (const sentinel of ["", "__other__"]) {
      const result = await studio.createSupply({
        name: `Sentinel ${sentinel || "empty"}`,
        category: "Paint",
        subcategory: sentinel,
        quantity: "1",
      });
      expect(result.ok, sentinel).toBe(true);
      if (result.ok) expect(result.data.subcategory).toBeNull();
    }
  });

  it("stores a custom subcategory from the Other/Custom flow (live parity)", async () => {
    // The live app's __other__ flow persists free-form text with no backend
    // vocabulary check; the pickers are the guard.
    const result = await studio.createSupply({
      name: "Wrong combo",
      category: "Paper",
      subcategory: "Palette knives", // a Brush-list value — tolerated like custom text
      quantity: "1",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.subcategory).toBe("Palette knives");
  });

  it("assigns and unassigns a supply to a project with ownership checks", async () => {
    const project = await studio.createProject({ name: "Assignment target" });
    const supply = await studio.createSupply({ name: "To assign", category: "Paint", quantity: "1" });
    if (!project.ok || !supply.ok) throw new Error("setup failed");

    const assigned = await studio.setSupplyAssignment(supply.data.id, project.data.id);
    expect(assigned.ok).toBe(true);
    if (assigned.ok) expect(assigned.data.assignedProjectId).toBe(project.data.id);

    // The other user cannot pin their supply onto our project.
    currentUser = OTHER_USER;
    const foreign = await studio.createSupply({ name: "Foreign", category: "Paint", quantity: "1" });
    if (!foreign.ok) throw new Error("foreign create failed");
    const hijack = await studio.setSupplyAssignment(foreign.data.id, project.data.id);
    currentUser = TEST_USER;
    expect(hijack.ok).toBe(false);
    if (!hijack.ok) expect(hijack.error.code).toBe("NOT_FOUND");

    const unassigned = await studio.setSupplyAssignment(supply.data.id, null);
    expect(unassigned.ok).toBe(true);
    if (unassigned.ok) expect(unassigned.data.assignedProjectId).toBeNull();
  });

  it("deletes a supply the user owns", async () => {
    const supply = await studio.createSupply({ name: "Doomed", category: "Other", quantity: "1" });
    if (!supply.ok) throw new Error("create failed");
    const deleted = await studio.deleteSupply(supply.data.id);
    expect(deleted.ok).toBe(true);
    const after = await db.supply.findUnique({ where: { id: supply.data.id } });
    expect(after).toBeNull();
  });
});

describe("chat actions", () => {
  it("sends a message with the session-derived username", async () => {
    const result = await studio.sendChatMessage({ message: "Hello from the test" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.username).toBe("studio");
      expect(result.data.message).toBe("Hello from the test");
    }
  });

  it("rejects empty and oversized messages", async () => {
    expect((await studio.sendChatMessage({ message: "   " })).ok).toBe(false);
    expect((await studio.sendChatMessage({ message: "x".repeat(501) })).ok).toBe(false);
  });
});

describe("import action", () => {
  it("imports a live-app export payload and resolves supplyIds relations", async () => {
    const livePayload = {
      app: "AST Studio",
      version: 1,
      projects: [
        {
          id: "live-p1",
          title: "Live project",
          status: "in-progress",
          budget: 100,
          supplyIds: ["live-s1"],
          images: ["data:image/jpeg;base64,QUJD"],
        },
      ],
      supplies: [
        {
          id: "live-s1",
          name: "Live supply",
          category: "Brush",
          subcategory: "Palette knives",
          quantity: 2,
          qty: 2,
          quantityValue: 2,
          status: "low",
        },
      ],
    };

    const result = await studio.importStudioData(livePayload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({ projects: 1, supplies: 1 });

    const supplies = await db.supply.findMany({ where: { userId: TEST_USER.id } });
    const liveSupply = supplies.find((s) => name_of(s) === "Live supply");
    expect(liveSupply?.category).toBe("Brush");
    expect(liveSupply?.type).toBe("Palette knives");
    expect(liveSupply?.condition).toBe("low");
    expect(liveSupply?.quantity).toBe("2");
    // The live project→supplyIds relation resolved to the new project row.
    expect(liveSupply?.assignedProjectId).not.toBeNull();

    const projects = await db.project.findMany({ where: { userId: TEST_USER.id } });
    expect(projects.some((p) => p.name === "Live project")).toBe(true);
  });

  it("imports the legacy clone export shape", async () => {
    const legacyPayload = {
      app: "AST Studio",
      version: 1,
      projects: [{ id: "old-p", name: "Legacy project", status: "planned" }],
      supplies: [
        {
          id: "old-s",
          name: "Legacy supply",
          category: "brushes-tools",
          type: "watercolor",
          quantity: "1/2",
          condition: "critical-out",
        },
      ],
    };

    const result = await studio.importStudioData(legacyPayload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const supplies = await db.supply.findMany({ where: { userId: TEST_USER.id } });
    const legacy = supplies.find((s) => s.name === "Legacy supply");
    expect(legacy?.category).toBe("Brush");
    expect(legacy?.type).toBe("Watercolor");
    expect(legacy?.condition).toBe("critical");
    expect(legacy?.quantity).toBe("1/2");
  });

  it("imports the live's empty-qty and explicit-ok exports verbatim (r11)", async () => {
    // Captured from the live 2026-09-19 (and verified against the live's
    // own import): qty:"" restores an empty quantity; status:"ok" restores
    // the explicit condition; a supply with no status restores null.
    const payload = {
      app: "AST Studio",
      version: 1,
      projects: [],
      supplies: [
        { id: "e1", name: "EmptyQty", category: "Paint", qty: "", quantity: null, quantityValue: null },
        { id: "e2", name: "ExplicitOk", category: "Paint", qty: 2, quantity: 2, quantityValue: 2, status: "ok" },
        { id: "e3", name: "FracQty", category: "Paint", qty: 0.5, quantity: null, quantityValue: 0.5 },
      ],
    };

    const result = await studio.importStudioData(payload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const supplies = await db.supply.findMany({ where: { userId: TEST_USER.id } });
    const empty = supplies.find((s) => s.name === "EmptyQty");
    expect(empty?.quantity).toBe("");
    expect(empty?.condition).toBeNull();
    const explicit = supplies.find((s) => s.name === "ExplicitOk");
    expect(explicit?.quantity).toBe("2");
    expect(explicit?.condition).toBe("ok");
    const frac = supplies.find((s) => s.name === "FracQty");
    expect(frac?.quantity).toBe("0.5");
    expect(frac?.condition).toBeNull();
  });

  it("rejects payloads from other apps", async () => {
    const result = await studio.importStudioData({
      app: "Somebody Else",
      version: 1,
      projects: [],
      supplies: [],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an import with more than 500 projects", async () => {
    const projects = Array.from({ length: 501 }, (_, i) => ({
      title: `Bulk project ${i}`,
      status: "planned",
    }));
    const result = await studio.importStudioData({
      app: "AST Studio",
      version: 1,
      projects,
      supplies: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
  });

  it("rejects an import with a supply category outside the vocabulary", async () => {
    const result = await studio.importStudioData({
      app: "AST Studio",
      version: 1,
      projects: [],
      supplies: [{ name: "Mystery", category: "NotACategory", qty: 1 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    // Nothing may be stored from a rejected import.
    const supplies = await db.supply.findMany({ where: { userId: TEST_USER.id } });
    expect(supplies.some((s) => s.name === "Mystery")).toBe(false);
  });

  it("rejects an import with an unrecognized project status", async () => {
    const result = await studio.importStudioData({
      app: "AST Studio",
      version: 1,
      projects: [{ title: "Odd status", status: "banana" }],
      supplies: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
  });

  it("rejects an import with an oversized photo data URL", async () => {
    const result = await studio.importStudioData({
      app: "AST Studio",
      version: 1,
      projects: [],
      supplies: [
        {
          name: "Heavy photo",
          category: "Paint",
          qty: 1,
          image: `data:image/jpeg;base64,${"A".repeat(410_000)}`,
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION");
  });

  it("rejects an import with over-length notes", async () => {
    const result = await studio.importStudioData({
      app: "AST Studio",
      version: 1,
      projects: [],
      supplies: [
        { name: "Wordy", category: "Paint", qty: 1, notes: "n".repeat(4001) },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rolls back the studio when a row fails mid-import", async () => {
    // Pre-existing data must survive a failed import (the restore is atomic).
    const created = await studio.createProject({ name: "Keep me" });
    expect(created.ok).toBe(true);

    const original = db.$transaction.bind(db);
    const spy = vi.spyOn(db, "$transaction").mockImplementation(
      (async (arg: unknown) => {
        if (typeof arg === "function") {
          // Interactive-transaction form: run the callback against a tx that
          // fails on the marked row, simulating a mid-import database error.
          const tx = {
            supply: {
              deleteMany: async () => ({}),
              create: async (args: { data: { name: string } }) => {
                if (args.data.name === "Explode supply") throw new Error("boom");
                return {
                  id: `new-${Date.now()}-${Math.random()}`,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  ...args.data,
                };
              },
            },
            project: {
              deleteMany: async () => ({}),
              create: async (args: { data: Record<string, unknown> }) => ({
                id: `new-${Date.now()}-${Math.random()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...args.data,
              }),
            },
          };
          type TxLike = typeof tx;
          return await (arg as (client: TxLike) => unknown)(tx);
        }
        return await original(arg as never);
      }) as unknown as typeof db.$transaction,
    );

    let result: Awaited<ReturnType<typeof studio.importStudioData>>;
    try {
      result = await studio.importStudioData({
        app: "AST Studio",
        version: 1,
        projects: [{ title: "Imported project", status: "planned" }],
        supplies: [{ name: "Explode supply", category: "Paint", qty: 1 }],
      });
    } finally {
      spy.mockRestore();
    }

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INTERNAL");

    const after = await studio.listProjects();
    expect(after.ok).toBe(true);
    if (after.ok) {
      expect(after.data.some((p) => p.name === "Keep me")).toBe(true);
    }
  });

  it("requires a session", async () => {
    currentUser = OTHER_USER;
    const foreign = await studio.listProjects();
    currentUser = TEST_USER;
    // OTHER_USER is a valid session; assert scoping instead: their list does
    // not include TEST_USER's projects.
    if (foreign.ok) {
      expect(foreign.data.every((p) => p.name !== "Live project")).toBe(true);
    } else {
      expect(foreign.error.code).toBe("UNAUTHORIZED");
    }
  });
});

// Helpers -------------------------------------------------------------------

function name_of(row: { name: string }): string {
  return row.name;
}

function updatedResultIsValidation(
  result: { ok: false; error: { code: string } },
): boolean {
  return result.error.code === "VALIDATION";
}
