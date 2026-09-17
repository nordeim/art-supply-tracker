"use server";

/**
 * Studio data actions — projects, supplies, chat, import.
 *
 * All reads/writes are scoped to the session user (userId comes from the
 * session, never from client input). Actions return ActionResult<T>; the
 * mappers below convert Prisma rows to DTOs so no server-only field leaks.
 */
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  internalError,
  notFound,
  unauthorized,
  validationError,
  type ActionResult,
} from "@/lib/result";
import {
  chatMessageSchema,
  normalizedImportPayloadSchema,
  projectInputSchema,
  supplyInputSchema,
} from "@/lib/validation";
import { normalizeImportPayload, resolveImportedAssignments } from "@/lib/export-payload";
import type {
  ChatMessageDto,
  ProjectDto,
  SupplyDto,
} from "@/lib/dto";

function toProjectDto(row: {
  id: string;
  name: string;
  status: string;
  budget: number | null;
  notes: string | null;
  photos: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProjectDto {
  let photos: string[] = [];
  if (row.photos) {
    try {
      const parsed: unknown = JSON.parse(row.photos);
      if (Array.isArray(parsed)) {
        photos = parsed.filter((p): p is string => typeof p === "string");
      }
    } catch {
      // Corrupt photo JSON degrades to "no photos" rather than breaking the view.
      photos = [];
    }
  }
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    budget: row.budget,
    notes: row.notes,
    photos,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toSupplyDto(row: {
  id: string;
  name: string;
  category: string;
  type: string | null;
  quantity: string;
  condition: string;
  location: string | null;
  notes: string | null;
  barcode: string | null;
  photo: string | null;
  assignedProjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SupplyDto {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subcategory: row.type,
    quantity: row.quantity,
    condition: row.condition,
    location: row.location,
    notes: row.notes,
    barcode: row.barcode,
    photo: row.photo,
    assignedProjectId: row.assignedProjectId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toChatDto(row: {
  id: string;
  username: string;
  email: string;
  message: string;
  createdAt: Date;
}): ChatMessageDto {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function listProjects(): Promise<ActionResult<ProjectDto[]>> {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const rows = await db.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return { ok: true, data: rows.map(toProjectDto) };
  } catch (error) {
    console.error("[projects:list] failed", { userId: user.id, error });
    return internalError();
  }
}

export async function createProject(
  input: unknown,
): Promise<ActionResult<ProjectDto>> {
  const user = await requireUser();
  if (!user) return unauthorized();

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Please check the project form.");
  }
  const { name, status, budget, notes, photos } = parsed.data;

  try {
    const row = await db.project.create({
      data: {
        userId: user.id,
        name,
        status,
        budget: budget ?? null,
        notes: notes ?? null,
        photos: photos?.length ? JSON.stringify(photos) : null,
      },
    });
    return { ok: true, data: toProjectDto(row) };
  } catch (error) {
    console.error("[projects:create] failed", { userId: user.id, error });
    return internalError();
  }
}

export async function updateProject(
  id: string,
  input: unknown,
): Promise<ActionResult<ProjectDto>> {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (typeof id !== "string" || id.length === 0) {
    return validationError("Invalid project reference.");
  }

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Please check the project form.");
  }
  const { name, status, budget, notes, photos } = parsed.data;

  try {
    const existing = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound("Project not found.");
    const row = await db.project.update({
      where: { id },
      data: {
        name,
        status,
        budget: budget ?? null,
        notes: notes ?? null,
        photos: photos?.length ? JSON.stringify(photos) : null,
      },
    });
    return { ok: true, data: toProjectDto(row) };
  } catch (error) {
    console.error("[projects:update] failed", { userId: user.id, id, error });
    return internalError();
  }
}

export async function deleteProject(id: string): Promise<ActionResult<true>> {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (typeof id !== "string" || id.length === 0) {
    return validationError("Invalid project reference.");
  }

  try {
    const existing = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound("Project not found.");
    // Supplies assigned to this project revert to studio inventory.
    await db.supply.updateMany({
      where: { assignedProjectId: id, userId: user.id },
      data: { assignedProjectId: null },
    });
    await db.project.delete({ where: { id } });
    return { ok: true, data: true };
  } catch (error) {
    console.error("[projects:delete] failed", { userId: user.id, id, error });
    return internalError();
  }
}

// ---------------------------------------------------------------------------
// Supplies
// ---------------------------------------------------------------------------

export async function listSupplies(): Promise<ActionResult<SupplyDto[]>> {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const rows = await db.supply.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return { ok: true, data: rows.map(toSupplyDto) };
  } catch (error) {
    console.error("[supplies:list] failed", { userId: user.id, error });
    return internalError();
  }
}

export async function createSupply(
  input: unknown,
): Promise<ActionResult<SupplyDto>> {
  const user = await requireUser();
  if (!user) return unauthorized();

  const parsed = supplyInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Please check the supply form.");
  }
  const data = parsed.data;

  try {
    const row = await db.supply.create({
      data: {
        userId: user.id,
        name: data.name,
        category: data.category,
        type: data.subcategory ?? null,
        quantity: data.quantity,
        condition: data.condition,
        location: data.location ?? null,
        notes: data.notes ?? null,
        barcode: data.barcode ?? null,
        photo: data.photo ?? null,
        assignedProjectId: data.assignedProjectId ?? null,
      },
    });
    return { ok: true, data: toSupplyDto(row) };
  } catch (error) {
    console.error("[supplies:create] failed", { userId: user.id, error });
    return internalError();
  }
}

export async function updateSupply(
  id: string,
  input: unknown,
): Promise<ActionResult<SupplyDto>> {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (typeof id !== "string" || id.length === 0) {
    return validationError("Invalid supply reference.");
  }

  const parsed = supplyInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Please check the supply form.");
  }
  const data = parsed.data;

  try {
    const existing = await db.supply.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound("Supply not found.");
    const row = await db.supply.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        type: data.subcategory ?? null,
        quantity: data.quantity,
        condition: data.condition,
        location: data.location ?? null,
        notes: data.notes ?? null,
        barcode: data.barcode ?? null,
        photo: data.photo ?? null,
        assignedProjectId: data.assignedProjectId ?? null,
      },
    });
    return { ok: true, data: toSupplyDto(row) };
  } catch (error) {
    console.error("[supplies:update] failed", { userId: user.id, id, error });
    return internalError();
  }
}

export async function deleteSupply(id: string): Promise<ActionResult<true>> {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (typeof id !== "string" || id.length === 0) {
    return validationError("Invalid supply reference.");
  }

  try {
    const existing = await db.supply.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound("Supply not found.");
    await db.supply.delete({ where: { id } });
    return { ok: true, data: true };
  } catch (error) {
    console.error("[supplies:delete] failed", { userId: user.id, id, error });
    return internalError();
  }
}

/**
 * Assign a supply to one of the user's projects (or back to studio
 * inventory with null). Backs the project detail panel's "Pick supply…
 * Assign" control and the × remove button. The project's ownership is
 * re-checked so one user cannot pin supplies onto another's project.
 */
export async function setSupplyAssignment(
  supplyId: string,
  projectId: string | null,
): Promise<ActionResult<SupplyDto>> {
  const user = await requireUser();
  if (!user) return unauthorized();
  if (typeof supplyId !== "string" || supplyId.length === 0) {
    return validationError("Invalid supply reference.");
  }
  if (projectId !== null && (typeof projectId !== "string" || projectId.length === 0)) {
    return validationError("Invalid project reference.");
  }

  try {
    const supply = await db.supply.findFirst({
      where: { id: supplyId, userId: user.id },
    });
    if (!supply) return notFound("Supply not found.");

    if (projectId !== null) {
      const project = await db.project.findFirst({
        where: { id: projectId, userId: user.id },
      });
      if (!project) return notFound("Project not found.");
    }

    const row = await db.supply.update({
      where: { id: supplyId },
      data: { assignedProjectId: projectId },
    });
    return { ok: true, data: toSupplyDto(row) };
  } catch (error) {
    console.error("[supplies:assign] failed", { userId: user.id, supplyId, projectId, error });
    return internalError();
  }
}

// ---------------------------------------------------------------------------
// Studio chat
// ---------------------------------------------------------------------------

const CHAT_WINDOW = 100;

export async function listChatMessages(): Promise<ActionResult<ChatMessageDto[]>> {
  // Chat is community-wide (matches the original) — no auth gate on read so
  // the panel renders identically pre- and post-refresh, but writes below
  // still require a session.
  try {
    const rows = await db.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: CHAT_WINDOW,
    });
    return { ok: true, data: rows.map(toChatDto).reverse() };
  } catch (error) {
    console.error("[chat:list] failed", { error });
    return internalError();
  }
}

export async function sendChatMessage(
  input: unknown,
): Promise<ActionResult<ChatMessageDto>> {
  const user = await requireUser();
  if (!user) return unauthorized();

  const parsed = chatMessageSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Message cannot be empty.");
  }

  // Username mirrors the original: email local-part.
  const username = user.email.split("@")[0] ?? user.displayName;

  try {
    const row = await db.chatMessage.create({
      data: { username, email: user.email, message: parsed.data.message },
    });
    return { ok: true, data: toChatDto(row) };
  } catch (error) {
    console.error("[chat:send] failed", { userId: user.id, error });
    return internalError();
  }
}

// ---------------------------------------------------------------------------
// Import JSON
// ---------------------------------------------------------------------------

export async function importStudioData(
  input: unknown,
): Promise<ActionResult<{ projects: number; supplies: number }>> {
  const user = await requireUser();
  if (!user) return unauthorized();

  // Both dialects — the live app's export shape and the clone's legacy
  // shape — normalize onto one internal payload before it is stored.
  const normalized = normalizeImportPayload(input);
  if (!normalized) {
    return validationError(
      "This file is not a valid AST Studio export. Expected the JSON downloaded from Export Data.",
    );
  }

  // The documented import bounds (PAD §6.1): array caps, string lengths,
  // photo caps, and the status/category/condition vocabulary enums. The
  // normalizer is deliberately lenient so both dialects fold onto one shape;
  // this gate is what actually refuses to store out-of-contract data.
  const parsed = normalizedImportPayloadSchema.safeParse(normalized);
  if (!parsed.success) {
    return validationError(
      "This export contains data the studio cannot import (unrecognized values or oversized content). Re-export from the app and try again.",
    );
  }

  try {
    // Replace the user's studio content wholesale — import is a restore, and
    // merging would duplicate every re-imported row. Delete + re-create run
    // inside ONE transaction: a mid-import failure rolls back, so a failed
    // restore never leaves the studio empty.
    await db.$transaction(async (tx) => {
      await tx.supply.deleteMany({ where: { userId: user.id } });
      await tx.project.deleteMany({ where: { userId: user.id } });

      const createdProjectIds: string[] = [];
      for (const project of normalized.projects) {
        const row = await tx.project.create({
          data: {
            userId: user.id,
            name: project.name,
            status: project.status,
            budget: project.budget,
            notes: project.notes,
            photos: project.photos.length ? JSON.stringify(project.photos) : null,
          },
        });
        createdProjectIds.push(row.id);
      }

      resolveImportedAssignments(normalized, createdProjectIds);

      for (const supply of normalized.supplies) {
        await tx.supply.create({
          data: {
            userId: user.id,
            name: supply.name,
            category: supply.category,
            type: supply.subcategory,
            quantity: supply.quantity,
            condition: supply.condition,
            location: supply.location,
            notes: supply.notes,
            barcode: supply.barcode,
            photo: supply.photo,
            assignedProjectId: supply.assignedProjectId,
          },
        });
      }
    });

    return {
      ok: true,
      data: { projects: normalized.projects.length, supplies: normalized.supplies.length },
    };
  } catch (error) {
    console.error("[import] failed", { userId: user.id, error });
    return internalError();
  }
}
