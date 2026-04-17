import { z } from "zod";
import { IdReferenceSchema } from "./common.js";
import { KindSchema, SEMVER_PATTERN, SLUG_PATTERN } from "./constants.js";

const IsoDateTime = z.string().refine((v) => !Number.isNaN(Date.parse(v)) && /T.+Z$/.test(v), {
  message: "must be ISO-8601 datetime with Z suffix",
});

const Sha256Hex = z.string().regex(/^[a-f0-9]{64}$/);

export const IndexEntrySchema = z
  .object({
    id: IdReferenceSchema,
    kind: KindSchema,
    name: z.string().regex(SLUG_PATTERN),
    displayName: z.string().min(1),
    description: z.string().max(160),
    tags: z.array(z.string().regex(SLUG_PATTERN)).max(5),
    category: z.string().min(1),
    verified: z.boolean(),
    version: z.string().regex(SEMVER_PATTERN),
    author: z.string().min(1),
    detailUrl: z.string().url(),
    sha256: Sha256Hex,
    updatedAt: IsoDateTime,
  })
  .strict()
  .refine((e) => e.id === `${e.kind}:${e.name}` || e.id.startsWith(`${e.kind}:@`), {
    message: "id must match kind and name",
  });

export type IndexEntry = z.infer<typeof IndexEntrySchema>;

export const RegistryIndexSchema = z
  .object({
    version: z.literal(1),
    generatedAt: IsoDateTime,
    count: z.number().int().nonnegative(),
    entries: z.array(IndexEntrySchema),
  })
  .strict()
  .refine((r) => r.count === r.entries.length, {
    message: "count must equal entries.length",
  });

export type RegistryIndex = z.infer<typeof RegistryIndexSchema>;

export const VerifiedIndexSchema = z
  .object({
    version: z.literal(1),
    entries: z.record(
      IdReferenceSchema,
      z
        .object({
          verifiedAt: IsoDateTime,
          verifiedBy: z.string().min(1),
          verifiedVersion: z.string().regex(SEMVER_PATTERN),
          reason: z.string().min(1).max(500),
          expiresAt: IsoDateTime.nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export type VerifiedIndex = z.infer<typeof VerifiedIndexSchema>;

export const RemovedIndexSchema = z
  .object({
    version: z.literal(1),
    entries: z.record(
      IdReferenceSchema,
      z
        .object({
          removedAt: IsoDateTime,
          reason: z.string().min(1).max(500),
          category: z.enum(["malicious", "broken", "ip-violation", "author-request", "security"]),
        })
        .strict(),
    ),
  })
  .strict();

export type RemovedIndex = z.infer<typeof RemovedIndexSchema>;
