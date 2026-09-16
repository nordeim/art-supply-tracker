/**
 * Client-safe DTOs — the shapes the UI renders. Server actions return these
 * (never raw Prisma rows), keeping the client contract stable and free of
 * server-only types like passwordHash.
 *
 * Field naming follows the wire contract where it is user-visible:
 * supplies carry a `subcategory` (the live app's field; stored in the
 * `Supply.type` column) and a `condition` (exported as `status`; see
 * src/lib/export-payload.ts for the mapping).
 */
import type { InspirationDetail } from "@/lib/inspiration";

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
  subcategory: string | null;
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
  /** Parsed from detailJson — typed overlay content (quote, tags, rights…). */
  detail: InspirationDetail | null;
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

/**
 * The export payload matches the original app's wire format, captured
 * verbatim from a live export on 2026-09-16. Field names and the numeric
 * quantity trio (quantityValue/quantity/qty) are load-bearing: exports
 * from the original app import here, and our exports import there.
 */
export interface ExportedProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  notes: string | null;
  coverImageUrl: string | null;
  imageKeys: string[];
  supplyIds: string[];
  createdAt: string;
  updatedAt: string;
  images: string[];
  imagePaths: string[];
  budget: number | null;
  isNew: boolean;
}

export interface ExportedSupply {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  itemType: string | null;
  unit: string | null;
  barcode: string | null;
  tags: string[];
  quantityValue: number | null;
  quantity: number | null;
  location: string | null;
  notes: string | null;
  imageKey: string | null;
  createdAt: string;
  updatedAt: string;
  usedInProjectIds: string[];
  qty: number | null;
  image: string | null;
  /** Present only when not "ok" — mirrors the live export. */
  status?: string;
  isNew: boolean;
}

export interface ExportPayload {
  app: "AST Studio";
  exportedAt: string;
  version: 1;
  projects: ExportedProject[];
  supplies: ExportedSupply[];
}
