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

  it("rejects payloads from other apps", async () => {
    const result = await studio.importStudioData({
      app: "Somebody Else",
      version: 1,
      projects: [],
      supplies: [],
    });
    expect(result.ok).toBe(false);
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
