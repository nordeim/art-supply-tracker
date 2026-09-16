/**
 * Client-safe DTOs — the shapes the UI renders. Server actions return these
 * (never raw Prisma rows), keeping the client contract stable and free of
 * server-only types like passwordHash.
 */

export interface ProjectDto {
  id: string;
  name: string;
  status: string;
  budget: number | null;
  notes: string | null;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplyDto {
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
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageDto {
  id: string;
  username: string;
  email: string;
  message: string;
  createdAt: string;
}

export type InspirationType = "art_history" | "artist_quote" | "studio_spotlight" | "partner";

export interface InspirationEntryDto {
  id: string;
  type: InspirationType;
  date: string | null;
  title: string;
  body: string | null;
  author: string | null;
  imageUrl: string | null;
}

export interface UserDto {
  email: string;
  displayName: string;
  lastWorkedOn: string;
}

/** Everything the studio shell needs on first paint, fetched server-side. */
export interface StudioBootstrap {
  user: UserDto;
  projects: ProjectDto[];
  supplies: SupplyDto[];
  chatMessages: ChatMessageDto[];
  inspiration: InspirationEntryDto[];
}

export interface ExportPayload {
  app: "AST Studio";
  exportedAt: string;
  version: 1;
  projects: ProjectDto[];
  supplies: SupplyDto[];
}
