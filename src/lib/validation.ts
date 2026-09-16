/**
 * Zod schemas — the single validation dialect. Every Server Action input is
 * parsed here before touching Prisma; the DTO schemas double as the types the
 * client components render, so invalid states cannot be constructed in the UI.
 */
import { z } from "zod";

import {
  SUPPLY_CATEGORY_VALUES,
  SUPPLY_CONDITION_VALUES,
  SUPPLY_TYPE_VALUES,
  PROJECT_STATUS_VALUES,
} from "@/lib/studio-domain";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(254, "Email is too long.");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1, "Display name is required.").max(60, "Display name is too long."),
});

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(120, "Project name is too long."),
  status: z.enum(PROJECT_STATUS_VALUES as [string, ...string[]]).default("planned"),
  budget: z
    .number()
    .min(0, "Budget cannot be negative.")
    .max(1_000_000, "Budget is too large.")
    .optional()
    .transform((v) => (Number.isFinite(v) ? v : undefined)),
  notes: optionalText(4000),
  photos: z.array(z.string().max(500)).max(10).optional(),
});

export const supplyInputSchema = z.object({
  name: z.string().trim().min(1, "Supply name is required.").max(160, "Supply name is too long."),
  category: z.enum(SUPPLY_CATEGORY_VALUES as [string, ...string[]]).default("paint"),
  type: z.enum(SUPPLY_TYPE_VALUES as [string, ...string[]]).optional().transform((v) => (v === "none" ? undefined : v)),
  quantity: z.string().trim().min(1).max(40).default("1"),
  condition: z.enum(SUPPLY_CONDITION_VALUES as [string, ...string[]]).default("ok"),
  location: optionalText(200),
  notes: optionalText(4000),
  barcode: optionalText(120),
  photo: optionalText(500),
  assignedProjectId: optionalText(50),
});

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty.").max(500, "Message is too long (500 characters max)."),
});

/** Payload accepted by the Import JSON flow (mirrors the export shape). */
export const importPayloadSchema = z.object({
  app: z.literal("AST Studio"),
  version: z.number().int().min(1).max(1),
  projects: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        status: z.enum(PROJECT_STATUS_VALUES as [string, ...string[]]).default("planned"),
        budget: z.number().min(0).max(1_000_000).nullable().optional(),
        notes: z.string().max(4000).nullable().optional(),
        photos: z.array(z.string().max(500)).max(10).nullable().optional(),
      }),
    )
    .max(500),
  supplies: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        category: z.enum(SUPPLY_CATEGORY_VALUES as [string, ...string[]]).default("paint"),
        type: z.string().max(60).nullable().optional(),
        quantity: z.string().trim().min(1).max(40).default("1"),
        condition: z.enum(SUPPLY_CONDITION_VALUES as [string, ...string[]]).default("ok"),
        location: z.string().max(200).nullable().optional(),
        notes: z.string().max(4000).nullable().optional(),
        barcode: z.string().max(120).nullable().optional(),
        photo: z.string().max(500).nullable().optional(),
        assignedProjectId: z.string().max(50).nullable().optional(),
      }),
    )
    .max(1000),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type SupplyInput = z.infer<typeof supplyInputSchema>;
export type ImportPayload = z.infer<typeof importPayloadSchema>;
