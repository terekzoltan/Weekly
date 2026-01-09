import { db } from './db';
import { Block, BlockKind } from '@/lib/models/types';

export const dayService = {
    async getDayBlocks(date: string): Promise<Block[]> {
        return db.transaction('rw', db.blocks, async () => {
            // Query blocks for this specific day
            const existingBlocks = await db.blocks
                .where('[scope.type+scope.id]')
                .equals(['day', date])
                .toArray();

            const requiredKinds: { kind: BlockKind; title: string }[] = [
                { kind: 'daily-habits', title: 'Daily Habits' },
                { kind: 'daily-checklist', title: 'Daily Routine' },
                { kind: 'daily-todo', title: 'Tasks' },
                { kind: 'daily-journal', title: 'Journal' },
            ];

            const missingBlocks: Block[] = [];

            // Check for missing blocks
            for (const required of requiredKinds) {
                if (!existingBlocks.some(b => b.kind === required.kind)) {
                    missingBlocks.push(createBlock(date, required.kind, required.title));
                }
            }

            // Deduplication (keep the first one found) - though backfill logic mostly handles specific kinds
            const uniqueBlocks: Block[] = [];
            const seenKinds = new Set<string>();
            const blocksToDelete: string[] = [];

            const allBlocks = [...existingBlocks, ...missingBlocks];

            for (const block of allBlocks) {
                if (seenKinds.has(block.kind)) {
                    // Duplicate found (e.g. from previous dupes or logic error), mark for deletion
                    // Keep existing over new? Or first existing?
                    // existingBlocks comes first in allBlocks.
                    blocksToDelete.push(block.id);
                } else {
                    seenKinds.add(block.kind);
                    uniqueBlocks.push(block);
                }
            }

            if (blocksToDelete.length > 0) {
                await db.blocks.bulkDelete(blocksToDelete);
            }

            if (missingBlocks.length > 0) {
                // Only add the ones that were truly missing and unique
                const toAdd = missingBlocks.filter(b => uniqueBlocks.some(ub => ub.id === b.id));
                if (toAdd.length > 0) {
                    await db.blocks.bulkAdd(toAdd);
                }
            }

            return uniqueBlocks;
        });
    },

    async updateBlock(id: string, updates: Partial<Block>): Promise<void> {
        await db.blocks.update(id, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    }
};

import { v4 as uuidv4 } from 'uuid';

function createBlock(date: string, kind: BlockKind, title: string): Block {
    const now = new Date().toISOString();
    return {
        id: uuidv4(),
        scope: { type: 'day', id: date },
        kind,
        title,
        content: '',
        items: [],
        createdAt: now,
        updatedAt: now,
    };
}
