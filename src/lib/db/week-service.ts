import { db } from './db';
import { Block, BlockKind } from '@/lib/models/types';

export const weekService = {
    async getWeekBlocks(weekId: string): Promise<Block[]> {
        return db.transaction('rw', db.blocks, async () => {
            // Query blocks for this specific week
            const blocks = await db.blocks
                .where('[scope.type+scope.id]')
                .equals(['week', weekId])
                .toArray();

            // Check for duplicates
            const uniqueBlocks = new Map<string, Block>();
            const duplicatesIds: string[] = [];

            for (const block of blocks) {
                if (uniqueBlocks.has(block.kind)) {
                    duplicatesIds.push(block.id);
                } else {
                    uniqueBlocks.set(block.kind, block);
                }
            }

            // Clean up duplicates if found
            if (duplicatesIds.length > 0) {
                console.log(`[WeekService] Cleaning up ${duplicatesIds.length} duplicate blocks`);
                await db.blocks.bulkDelete(duplicatesIds);
                return Array.from(uniqueBlocks.values());
            }

            if (blocks.length > 0) {
                return blocks;
            }

            // If no blocks exist, create defaults
            const defaultBlocks: Block[] = [
                createBlock(weekId, 'weekly-journal', 'Weekly Journal'),
                createBlock(weekId, 'weekly-todo', 'Weekly Tasks'),
                createBlock(weekId, 'important-concepts', 'Important Concepts'),
                createBlock(weekId, 'meta-update', 'Meta / Updates'),
                createBlock(weekId, 'games', 'Games Played'),
            ];

            await db.blocks.bulkAdd(defaultBlocks);
            return defaultBlocks;
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

function createBlock(weekId: string, kind: BlockKind, title: string): Block {
    const now = new Date().toISOString();
    return {
        id: uuidv4(),
        scope: { type: 'week', id: weekId },
        kind,
        title,
        content: '',
        items: [],
        createdAt: now,
        updatedAt: now,
    };
}
