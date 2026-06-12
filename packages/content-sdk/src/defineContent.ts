import { z } from 'zod';

export type ContentId = string;
export type ModuleId = string;
export type ReleaseId = string;
export type VariantId = string;
export type RingId = 'dev' | 'friends' | 'public';
export type ClientId = string;

export const ringSchema = z.enum(['dev', 'friends', 'public']);
export const contentStatusSchema = z.enum(['scheduled', 'published', 'expired', 'revoked']);
export const manifestActionSchema = z.enum(['add', 'update', 'replace', 'expire', 'revoke']);

export const seoSchema = z.object({
  indexable: z.boolean().default(false),
  title: z.string(),
  description: z.string(),
  canonicalPath: z.string(),
  lastmod: z.string().datetime().optional(),
  image: z.string().optional(),
});

export const releaseConfigSchema = z.object({
  releaseId: z.string(),
  releaseAt: z.string().datetime().optional(),
  unlockAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  ring: ringSchema.default('public'),
});

export const deliveryConfigSchema = z.object({
  preload: z.boolean().default(false),
  encrypted: z.boolean().default(false),
  deleteIfLockedAfter: z.string().datetime().optional(),
  deleteAfter: z.string().datetime().optional(),
});

export const variantConfigSchema = z.object({
  id: z.string(),
  moduleId: z.string().optional(),
  entry: z.string(),
  css: z.array(z.string()).default([]),
  weight: z.number().min(0).max(100).optional(),
  rings: z.array(ringSchema).default(['public']),
  rules: z.array(z.string()).default([]),
});

export const contentConfigSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  kind: z.enum(['article', 'page', 'demo', 'module']),
  route: z.string(),

  release: releaseConfigSchema,

  delivery: deliveryConfigSchema,

  variants: z.array(variantConfigSchema).min(1),
  seo: seoSchema,
  body: z.string().default(''),
  source: z.enum(['repo', 'admin']).default('repo'),
  override: z.boolean().default(false),
});

export type ContentConfig = z.infer<typeof contentConfigSchema>;
export type ReleaseConfig = z.infer<typeof releaseConfigSchema>;
export type VariantConfig = z.infer<typeof variantConfigSchema>;

export const moduleRegistryEntrySchema = z.object({
  moduleId: z.string(),
  version: z.string(),
  entryUrl: z.string(),
  assets: z.array(z.string()).default([]),
  integrity: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
  compatibleShellRange: z.string(),
  hotReloadCapable: z.boolean().default(false),
  status: z.enum(['draft', 'active', 'expired', 'revoked']),
});

export type ModuleRegistryEntry = z.infer<typeof moduleRegistryEntrySchema>;

export const decisionRequestSchema = z.object({
  contentId: z.string().optional(),
  moduleId: z.string().optional(),
  client: z.object({
    clientId: z.string(),
    ring: ringSchema.optional(),
    traits: z.record(z.string(), z.unknown()).default({}),
  }),
  context: z.record(z.string(), z.unknown()).default({}),
});

export const decisionResponseSchema = z.object({
  decisionId: z.string(),
  contentId: z.string(),
  moduleId: z.string(),
  variantId: z.string(),
  releaseId: z.string(),
  moduleVersion: z.string(),
  entryUrl: z.string(),
  assets: z.array(z.string()).default([]),
  preloadPlan: z.array(z.string()).default([]),
  reason: z.string(),
  ttlSeconds: z.number(),
  serverNow: z.string(),
  hotReloadCapable: z.boolean().default(false),
});

export type DecisionRequest = z.infer<typeof decisionRequestSchema>;
export type DecisionResponse = z.infer<typeof decisionResponseSchema>;

export const encryptedBundleMetadataSchema = z.object({
  algorithm: z.literal('AES-GCM'),
  iv: z.string(),
  keyId: z.string(),
  ciphertextUrl: z.string(),
  sha256: z.string(),
});

export type EncryptedBundleMetadata = z.infer<typeof encryptedBundleMetadataSchema>;

export const manifestEntrySchema = z.object({
  id: z.string(),
  contentId: z.string(),
  releaseId: z.string(),
  variantId: z.string(),
  status: contentStatusSchema,
  route: z.string(),
  encryptedPayloadUrl: z.string().optional(),
  payloadUrl: z.string().optional(),
  unlockAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  action: manifestActionSchema,
  title: z.string(),
  description: z.string(),
  body: z.string().optional(),
  encrypted: encryptedBundleMetadataSchema.optional(),
  seo: seoSchema,
});

export const deliveryManifestSchema = z.object({
  manifestVersion: z.number(),
  generatedAt: z.string(),
  entries: z.array(manifestEntrySchema),
});

export type ManifestEntry = z.infer<typeof manifestEntrySchema>;
export type DeliveryManifest = z.infer<typeof deliveryManifestSchema>;

export const unlockRequestSchema = z.object({
  contentId: z.string(),
  variantId: z.string(),
  clientId: z.string(),
  code: z.string().optional(),
});

export const unlockResponseSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    releaseId: z.string(),
    contentId: z.string(),
    variantId: z.string(),
    keyId: z.string(),
    key: z.string(),
    algorithm: z.literal('AES-GCM'),
    serverNow: z.string(),
  }),
  z.object({
    ok: z.literal(false),
    reason: z.enum(['too_early', 'invalid_code', 'rate_limited', 'revoked', 'not_found']),
    retryAfterSeconds: z.number().optional(),
    serverNow: z.string(),
  }),
]);

export type UnlockRequest = z.infer<typeof unlockRequestSchema>;
export type UnlockResponse = z.infer<typeof unlockResponseSchema>;

export const developerSignalSchema = z.object({
  id: z.string(),
  type: z.enum([
    'flag.enabled',
    'module.built',
    'devcontainer.opened',
    'release.promoted',
    'module.revoked',
  ]),
  moduleId: z.string().optional(),
  releaseId: z.string().optional(),
  flagKey: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
});

export type DeveloperSignal = z.infer<typeof developerSignalSchema>;

export function defineContent(config: ContentConfig): ContentConfig {
  return contentConfigSchema.parse(config);
}
