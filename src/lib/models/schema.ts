import { z } from 'zod';

export const ScopeTypeSchema = z.enum(['day', 'week', 'year']);

export const ScopeSchema = z.object({
    type: ScopeTypeSchema,
    id: z.string(),
});

export const BlockKindSchema = z.enum([
    'daily-checklist',
    'daily-todo',
    'daily-journal',
    'daily-habits',
    'daily-summary-public',
    'daily-summary-private',
    'weekly-journal',
    'important-concepts',
    'weekly-todo',
    'weekly-summary',
    'monthly-summary',
    'meta-update',
    'games',
    'yearly-goals',
    'yearly-summary',
]);

export const ContentBlockKindSchema = z.enum(['text', 'bullet-list', 'quote', 'inline-tag']);

export const ContentBlockSchema = z.object({
    id: z.string(),
    kind: ContentBlockKindSchema,
    text: z.string(),
});

export const DailyHabitsSchema = z.object({
    bedtime: z.string().optional(),
    wakeup: z.string().optional(),
    sleepLength: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
    slk: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
    sport: z.string().optional(),
    med: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
    caps: z.string().optional(),
    prog: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
    nap: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
    kaj: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
    fa: z.boolean().optional(),
    watch: z.boolean().optional(),
    min: z.boolean().optional(),
    hr: z.boolean().optional(),
});

// Generic Block Schema (Data is still Record<string, any> generally, but specific logic can use DailyHabitsSchema)
export const BlockSchema = z.object({
    id: z.string(),
    scope: ScopeSchema,
    kind: BlockKindSchema,
    title: z.string().optional(),
    content: z.string().optional(),
    items: z.array(ContentBlockSchema).optional(),
    data: z.record(z.string(), z.any()).optional(),
    searchText: z.string().optional(), // New field for normalized search text
    createdAt: z.string(),
    updatedAt: z.string(),
});
