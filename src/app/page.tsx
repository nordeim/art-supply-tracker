/**
 * AST Studio — single-route app shell.
 *
 * The original production app is a Vite SPA with React Router views
 * (/dashboard, /projects, /supplies, /inspiration). This clone keeps the
 * single Next.js route and switches views client-side, rendering the login
 * screen when no session cookie is present. All first-paint data is fetched
 * here (server-side) and handed to the client shell as typed DTOs.
 */
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseInspirationDetail } from "@/lib/inspiration";
import type {
  ChatMessageDto,
  InspirationEntryDto,
  ProjectDto,
  SupplyDto,
} from "@/lib/dto";
import { LoginScreen } from "@/components/studio/login-screen";
import { StudioApp } from "@/components/studio/studio-app";

export const dynamic = "force-dynamic";

function parsePhotos(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === "string");
  } catch {
    return [];
  }
}

export default async function StudioPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginScreen />;
  }

  const [projectRows, supplyRows, chatRows, inspirationRows] =
    await Promise.all([
      db.project.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      }),
      db.supply.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      }),
      db.chatMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.inspirationEntry.findMany({
        orderBy: { sortOrder: "asc" },
      }),
    ]);

  const projects: ProjectDto[] = projectRows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    budget: row.budget,
    notes: row.notes,
    photos: parsePhotos(row.photos),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  const supplies: SupplyDto[] = supplyRows.map((row) => ({
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
  }));

  const chatMessages: ChatMessageDto[] = chatRows
    .map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
    }))
    .reverse();

  const inspiration: InspirationEntryDto[] = inspirationRows.map((row) => ({
    id: row.id,
    type: row.type as InspirationEntryDto["type"],
    date: row.date,
    title: row.title,
    body: row.body,
    author: row.author,
    imageUrl: row.imageUrl,
    detail: parseInspirationDetail(row.detailJson),
  }));

  return (
    <StudioApp
      user={{
        email: user.email,
        displayName: user.displayName,
        lastWorkedOn: user.lastWorkedOn,
      }}
      projects={projects}
      supplies={supplies}
      chatMessages={chatMessages}
      inspiration={inspiration}
    />
  );
}
