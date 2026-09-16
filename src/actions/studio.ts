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
  importPayloadSchema,
  projectInputSchema,
  supplyInputSchema,
} from "@/lib/validation";
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
    type: row.type,
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
        type: data.type ?? null,
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
        type: data.type ?? null,
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

  const parsed = importPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(
      parsed.error.issues[0]?.message ??
        "This file is not a valid AST Studio export. Expected the JSON downloaded from Export Data.",
    );
  }
  const payload = parsed.data;

  try {
    // Replace the user's studio content wholesale — import is a restore, and
    // merging would duplicate every re-imported row.
    await db.$transaction([
      db.supply.deleteMany({ where: { userId: user.id } }),
      db.project.deleteMany({ where: { userId: user.id } }),
      ...payload.projects.map((p) =>
        db.project.create({
          data: {
            userId: user.id,
            name: p.name,
            status: p.status,
            budget: p.budget ?? null,
            notes: p.notes ?? null,
            photos: p.photos?.length ? JSON.stringify(p.photos) : null,
          },
        }),
      ),
      ...payload.supplies.map((s) =>
        db.supply.create({
          data: {
            userId: user.id,
            name: s.name,
            category: s.category,
            type: s.type ?? null,
            quantity: s.quantity,
            condition: s.condition,
            location: s.location ?? null,
            notes: s.notes ?? null,
            barcode: s.barcode ?? null,
            photo: s.photo ?? null,
            assignedProjectId: s.assignedProjectId ?? null,
          },
        }),
      ),
    ]);
    return { ok: true, data: { projects: payload.projects.length, supplies: payload.supplies.length } };
  } catch (error) {
    console.error("[import] failed", { userId: user.id, error });
    return internalError();
  }
}
