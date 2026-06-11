import { z } from 'zod';

export const contentConfigSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(['article', 'page', 'demo', 'module']),
  route: z.string(),

  release: z.object({
    releaseId: z.string(),
    releaseAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    ring: z.enum(['dev', 'friends', 'public']).default('public'),
  }),

  delivery: z.object({
    preload: z.boolean().default(false),
    encrypted: z.boolean().default(false),
    deleteIfLockedAfter: z.string().datetime().optional(),
    deleteAfter: z.string().datetime().optional(),
  }),

  variants: z.array(
    z.object({
      id: z.string(),
      entry: z.string(),
      css: z.array(z.string()).default([]),
      weight: z.number().min(0).max(100).optional(),
      rules: z.array(z.string()).default([]),
    })
  ),
});

export type ContentConfig = z.infer<typeof contentConfigSchema>;

export function defineContent(config: ContentConfig): ContentConfig {
  return contentConfigSchema.parse(config);
}
