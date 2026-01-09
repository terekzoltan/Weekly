import { db } from './db';
import { Block, BlockKind } from '@/lib/models/types';

export const yearService = {
    async getYearBlocks(year: string): Promise<Block[]> {
        // Query blocks for this specific year
        const blocks = await db.blocks
            .where('[scope.type+scope.id]')
            .equals(['year', year])
            .toArray();

        if (blocks.length > 0) {
            return blocks;
        }

        // If no blocks exist, create defaults
        const defaultBlocks: Block[] = [
            createBlock(year, 'yearly-summary', 'Yearly Summary'),
            createBlock(year, 'yearly-goals', 'Yearly Goals'),
        ];

        await db.blocks.bulkAdd(defaultBlocks);
        return defaultBlocks;
    },

    async updateBlock(id: string, updates: Partial<Block>): Promise<void> {
        await db.blocks.update(id, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    }
};

function createBlock(year: string, kind: BlockKind, title: string): Block {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(),
        scope: { type: 'year', id: year },
        kind,
        title,
        content: '',
        items: [],
        createdAt: now,
        updatedAt: now,
    };
}
