'use client';

import { DailyChecklist } from './daily-checklist';
import { Block } from '@/lib/models/types';

// For now, Todo behaves exactly like Checklist visually.
// We can differentiate them later with different styling or features (e.g. priority).
export function DailyTodo({ block }: { block: Block }) {
    return <DailyChecklist block={block} />;
}
