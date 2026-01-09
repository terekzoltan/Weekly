import { z } from 'zod';
import {
  ScopeTypeSchema,
  ScopeSchema,
  BlockKindSchema,
  ContentBlockKindSchema,
  ContentBlockSchema,
  BlockSchema
} from './schema';

export type ScopeType = z.infer<typeof ScopeTypeSchema>;
export type Scope = z.infer<typeof ScopeSchema>;
export type BlockKind = z.infer<typeof BlockKindSchema>;
export type ContentBlockKind = z.infer<typeof ContentBlockKindSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type Block = z.infer<typeof BlockSchema>;

