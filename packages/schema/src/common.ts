import { z } from "zod";
import { RECOMMENDED_CATEGORIES, SEMVER_PATTERN, SLUG_PATTERN } from "./constants.js";

export const AuthorSchema = z
  .object({
    name: z.string().min(1).max(100),
    github: z
      .string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/, "invalid github handle"),
    url: z
      .string()
      .url()
      .refine((u) => u.startsWith("https://") || u.startsWith("http://"), {
        message: "url must be http(s)",
      })
      .optional(),
  })
  .strict();

const IsoDateTime = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)) && /T.+Z$/.test(v), {
    message: "must be ISO-8601 datetime with Z suffix",
  });

const Sha256Hex = z.string().regex(/^[a-f0-9]{64}$/, "must be 64-char lowercase hex");
const GitSha = z.string().regex(/^[a-f0-9]{7,40}$/, "must be git SHA");

export const IdReferenceSchema = z
  .string()
  .regex(
    /^(skill|agent|hook|mcp|cmd|preset):(@[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/)?[a-z][a-z0-9-]{0,63}$/,
    "must be a clawmart id",
  );

export const BaseEntrySchema = z
  .object({
    name: z.string().regex(SLUG_PATTERN, "must be kebab-case slug"),
    displayName: z.string().min(1).max(80),
    description: z.string().min(1).max(160),
    author: AuthorSchema,
    tags: z.array(z.string().regex(SLUG_PATTERN)).max(5),
    category: z.string().min(1),
    version: z.string().regex(SEMVER_PATTERN, "must be valid semver"),
    license: z.string().min(1),
    claudeCodeVersion: z.string().optional(),
    requires: z.array(IdReferenceSchema).optional(),
    conflicts: z.array(IdReferenceSchema).optional(),
    repository: z
      .object({
        type: z.literal("git"),
        url: z.string().url(),
      })
      .strict()
      .optional(),
    verified: z.boolean(),
    createdAt: IsoDateTime,
    updatedAt: IsoDateTime,
    sourceCommit: GitSha,
    sourcePR: z.string().url().optional(),
    sha256: Sha256Hex,
  })
  .strict();

export type Author = z.infer<typeof AuthorSchema>;
export type BaseEntry = z.infer<typeof BaseEntrySchema>;

export const RECOMMENDED_CATEGORY_SET: ReadonlySet<string> = new Set(
  RECOMMENDED_CATEGORIES,
);
