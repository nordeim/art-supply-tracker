/**
 * Zod schemas — the single validation dialect. Every Server Action input is
 * parsed here before touching Prisma; the DTO schemas double as the types the
 * client components render, so invalid states cannot be constructed in the UI.
 */
import { z } from "zod";

import {
  MAX_PHOTO_DATA_URL_LENGTH,
  PROJECT_STATUS_VALUES,
  SUBCATEGORY_NONE,
  SUBCATEGORY_OTHER,
  SUPPLY_CATEGORY_VALUES,
  SUPPLY_CONDITION_VALUES,
  supplyTypeListFor,
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

const photoSchema = z.string().max(MAX_PHOTO_DATA_URL_LENGTH, "Photo is too large.");

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
  photos: z.array(photoSchema).max(10).optional(),
});

/**
 * Supply input. `subcategory` arrives as the picker's raw select value —
 * the None/Other sentinels normalize to undefined — and is then
 * cross-checked against the chosen category's list (the live app's
 * pickers are category-scoped, so a Brush subcategory on a Paper supply
 * is invalid input, not a valid free-form value).
 */
export const supplyInputSchema = z
  .object({
    name: z.string().trim().min(1, "Supply name is required.").max(160, "Supply name is too long."),
    category: z.enum(SUPPLY_CATEGORY_VALUES as [string, ...string[]]).default("Paint"),
    subcategory: z
      .string()
      .max(60)
      .optional()
      .transform((v) =>
        v === undefined || v === SUBCATEGORY_NONE || v === SUBCATEGORY_OTHER || v === "none"
          ? undefined
          : v,
      ),
    quantity: z.string().trim().min(1).max(40).default("1"),
    condition: z.enum(SUPPLY_CONDITION_VALUES as [string, ...string[]]).default("ok"),
    location: optionalText(200),
    notes: optionalText(4000),
    barcode: optionalText(120),
    photo: optionalText(MAX_PHOTO_DATA_URL_LENGTH),
    assignedProjectId: optionalText(50),
  })
  .superRefine((data, ctx) => {
    if (
      data.subcategory !== undefined &&
      !supplyTypeListFor(data.category).some((t) => t.value === data.subcategory)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["subcategory"],
        message: "Pick a subcategory from the category's list.",
      });
    }
  });

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty.").max(500, "Message is too long (500 characters max)."),
});

/**
 * Payload accepted by the Import JSON flow. This is the LIVE app's export
 * shape (title/subcategory/status/numeric quantities…). Legacy clone
 * exports are translated onto this shape by `normalizeImportPayload`
 * before parsing, so both dialects import through one schema.
 */
export const importPayloadSchema = z.object({
  app: z.literal("AST Studio"),
  version: z.number().int().min(1).max(1),
  projects: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        status: z.enum(PROJECT_STATUS_VALUES as [string, ...string[]]).default("planned"),
        budget: z.number().min(0).max(1_000_000).nullable().optional(),
        notes: z.string().max(4000).nullable().optional(),
        images: z.array(z.string().max(MAX_PHOTO_DATA_URL_LENGTH)).max(10).optional(),
      }),
    )
    .max(500),
  supplies: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        category: z.enum(SUPPLY_CATEGORY_VALUES as [string, ...string[]]).default("Paint"),
        subcategory: z.string().max(60).nullable().optional(),
        quantityValue: z.number().nullable().optional(),
        quantity: z.union([z.number(), z.string().max(40)]).nullable().optional(),
        qty: z.number().nullable().optional(),
        status: z.enum(SUPPLY_CONDITION_VALUES as [string, ...string[]]).optional(),
        location: z.string().max(200).nullable().optional(),
        notes: z.string().max(4000).nullable().optional(),
        barcode: z.string().max(120).nullable().optional(),
        image: z.string().max(MAX_PHOTO_DATA_URL_LENGTH).nullable().optional(),
      }),
    )
    .max(1000),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type SupplyInput = z.infer<typeof supplyInputSchema>;
export type ImportPayload = z.infer<typeof importPayloadSchema>;
