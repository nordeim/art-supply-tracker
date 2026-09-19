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
  isValidQuantityInput,
} from "@/lib/studio-domain";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(254, "Email is too long.");

/** The live app's Cognito password policy, in its exact Amplify copy
 * (r9 — measured on the deployed app: every violated rule renders as its
 * own line, so the rules must be checked INDEPENDENTLY, never merged).
 * Client-side this drives the signup policy stack; the signUpSchema mirrors
 * it server-side as defense in depth. */
const PASSWORD_POLICY_RULES: Array<{
  test: (pw: string) => boolean;
  message: string;
}> = [
  { test: (pw) => pw.length >= 8, message: "Password must have at least 8 characters" },
  { test: (pw) => /[A-Z]/.test(pw), message: "Password must have upper case letters" },
  { test: (pw) => /[a-z]/.test(pw), message: "Password must have lower case letters" },
  { test: (pw) => /[0-9]/.test(pw), message: "Password must have numbers" },
  { test: (pw) => /[^A-Za-z0-9]/.test(pw), message: "Password must have special characters" },
];

/** Every Cognito rule the given password violates, in the live app's
 * display order (length → upper → lower → number → special). */
export function passwordPolicyViolations(password: string): string[] {
  return PASSWORD_POLICY_RULES.filter((rule) => !rule.test(password)).map(
    (rule) => rule.message,
  );
}

/** Sign-in NEVER policy-checks the password (r9): on the live, a short
 * password submits and Cognito answers "Incorrect username or password."
 * The schema therefore only guards against empty/oversized input; every
 * real mismatch is resolved by the credential check itself. */
const signInPasswordSchema = z
  .string()
  .min(1, "Incorrect username or password.")
  .max(256, "Incorrect username or password.");

export const signInSchema = z.object({
  email: emailSchema,
  password: signInPasswordSchema,
});

/** Server-side mirror of the Cognito sign-up policy (r9). Unreachable via
 * the UI — the browser blocks empty fields natively and the client shows
 * the rule stack before submitting — but the boundary must not store a
 * policy-violating password if it is ever called directly. */
const signUpPasswordSchema = z
  .string()
  .min(1, "Password is required.")
  .max(128, "Password is too long.")
  .superRefine((pw, ctx) => {
    const violations = passwordPolicyViolations(pw);
    if (violations.length > 0) {
      ctx.addIssue({ code: "custom", message: violations[0] });
    }
  });

export const signUpSchema = z.object({
  email: emailSchema,
  password: signUpPasswordSchema,
  // The live app's Cognito sign-up asks only for email + password (+ client
  // confirm); the display name is derived server-side (see deriveDisplayName).
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(60, "Display name is too long.")
    .optional(),
});

/**
 * Derives the user's display name from the email local part — the same
 * convention the community chat uses for its usernames (the live app never
 * collects a display name on sign-up). Degrades to "Artist" for malformed
 * addresses so the required Prisma field always has a value.
 */
export function deriveDisplayName(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  return localPart && localPart.length > 0 ? localPart.slice(0, 60) : "Artist";
}

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
 * the None/Other sentinels normalize to undefined. Values outside the
 * category's list are ACCEPTED: the live app's Other/Custom flow stores
 * free-form text (`subcategory === '__other__' ? custom.trim() || '' :
 * value`) and its backend has no vocabulary check — the category-scoped
 * pickers are the guard, exactly as in production. The schema keeps the
 * type/trim/length discipline.
 *
 * `condition` is the live's two-state status (r11, measured 2026-09-19):
 * null = ABSENT (supplies created through the modal never store one — its
 * Stock Status select is inert on the live), while "ok" | "low" |
 * "critical" are the explicit values the EDIT panel saves. `quantity`
 * follows the live's format gate: empty is valid (stored as ""), and
 * only plain numbers / simple a/b fractions pass — the modal enforces the
 * same rule client-side with the live's exact error copy.
 */
export const supplyInputSchema = z.object({
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
  quantity: z
    .string()
    .trim()
    .max(40, "Quantity is too long.")
    .default("")
    .refine(isValidQuantityInput, {
      message: "Enter a valid quantity, like 2, 1.5, or 1/2",
    }),
  condition: z
    .enum(SUPPLY_CONDITION_VALUES as [string, ...string[]])
    .nullable()
    .default(null),
  location: optionalText(200),
  notes: optionalText(4000),
  barcode: optionalText(120),
  photo: optionalText(MAX_PHOTO_DATA_URL_LENGTH),
  assignedProjectId: optionalText(50),
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
        qty: z.union([z.number(), z.literal("")]).nullable().optional(),
        status: z.enum(SUPPLY_CONDITION_VALUES as [string, ...string[]]).optional(),
        location: z.string().max(200).nullable().optional(),
        notes: z.string().max(4000).nullable().optional(),
        barcode: z.string().max(120).nullable().optional(),
        image: z.string().max(MAX_PHOTO_DATA_URL_LENGTH).nullable().optional(),
      }),
    )
    .max(1000),
});

/**
 * The gate for normalized import payloads — what `normalizeImportPayload`
 * produces after both dialects (live-app and legacy clone) have been folded
 * onto one shape. This is the enforcement point for the documented import
 * bounds (PAD §6.1): array caps, string lengths, photo caps, and the
 * status/category/condition vocabulary enums. `importStudioData` refuses to
 * store anything this schema does not accept.
 */
export const normalizedImportPayloadSchema = z.object({
  projects: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        status: z.enum(PROJECT_STATUS_VALUES as [string, ...string[]]),
        budget: z.number().min(0).max(1_000_000).nullable(),
        notes: z.string().max(4000).nullable(),
        photos: z.array(z.string().max(MAX_PHOTO_DATA_URL_LENGTH)).max(10),
      }),
    )
    .max(500),
  supplies: z
    .array(
      z.object({
        name: z.string().min(1).max(160),
        category: z.enum(SUPPLY_CATEGORY_VALUES as [string, ...string[]]),
        subcategory: z.string().max(60).nullable(),
        // Empty quantities are valid live data (stored as ""; the live's
        // exports carry qty: "" — r11) — only the length is bounded here.
        quantity: z.string().max(40),
        condition: z.enum(SUPPLY_CONDITION_VALUES as [string, ...string[]]).nullable(),
        location: z.string().max(200).nullable(),
        notes: z.string().max(4000).nullable(),
        barcode: z.string().max(120).nullable(),
        photo: z.string().max(MAX_PHOTO_DATA_URL_LENGTH).nullable(),
        assignedProjectId: z.string().max(60).nullable(),
      }),
    )
    .max(1000),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type SupplyInput = z.infer<typeof supplyInputSchema>;
export type ImportPayload = z.infer<typeof importPayloadSchema>;
