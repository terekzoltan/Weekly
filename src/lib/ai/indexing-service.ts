import { db } from '@/lib/db/db';
import { Block } from '@/lib/models/types';
import { AIDocument } from '@/lib/models/ai-types';
import { ollamaService } from './ollama-service';
import { flattenDailyData } from './data-preparation';

const EMBEDDING_MODEL = 'bge-m3'; // Default, should be configurable

export const indexingService = {
    async indexBlock(block: Block): Promise<void> {
        // Only index blocks that are relevant for retrieval
        // For now: journals and summaries. 
        // Habits/Todos are better indexed as part of the daily context (flattening).

        // Strategy: We primarily index "Days" via flattening, plus specific high-value blocks (like weekly summaries).
        // BUT, the current Block-based approach might be better served by:
        // 1. Indexing Daily Summaries (Public & Private) - high value text.
        // 2. Indexing Raw Journals - IF user wants to search raw.

        let textToIndex = '';

        if (block.kind === 'daily-summary-public' || block.kind === 'daily-summary-private' || block.kind === 'weekly-summary') {
            textToIndex = block.content || '';
        } else if (block.kind === 'daily-journal' || block.kind === 'weekly-journal') {
            textToIndex = block.content || '';
            // Search existing items logic if needed
        }

        if (!textToIndex || textToIndex.length < 10) {
            return; // Skip empty or too short blocks
        }

        try {
            const embedding = await ollamaService.generateEmbedding(textToIndex, EMBEDDING_MODEL);

            const doc: AIDocument = {
                id: block.id, // 1:1 mapping for simple blocks
                blockId: block.id,
                scopeId: block.scope.id,
                scopeType: block.scope.type as 'day' | 'week' | 'year',
                kind: block.kind,
                text: textToIndex,
                embedding,
                metadata: {
                    isPrivate: block.kind.includes('private') || block.kind.includes('journal'),
                    generatedAt: new Date().toISOString(),
                    model: EMBEDDING_MODEL
                }
            };

            await db.aiDocs.put(doc);
            console.log(`Indexed block ${block.id} (${block.kind})`);

        } catch (error) {
            console.error(`Failed to index block ${block.id}:`, error);
        }
    },

    async indexDay(date: string): Promise<void> {
        // Special indexing logic: Create a "synthetic" document for the entire day's public context (Habits + Todo stats)
        // This allows searching for "When did I sleep poorly?" without needing a specific summary block.

        const blocks = await db.blocks.where('[scope.type+scope.id]').equals(['day', date]).toArray();
        if (blocks.length === 0) return;

        const flattenedText = flattenDailyData(blocks, 'public');
        if (!flattenedText) return;

        // ID for synthetic doc
        const syntheticId = `day-context-${date}`;

        try {
            const embedding = await ollamaService.generateEmbedding(flattenedText, EMBEDDING_MODEL);

            const doc: AIDocument = {
                id: syntheticId,
                blockId: syntheticId, // No single source block
                scopeId: date,
                scopeType: 'day',
                kind: 'day-context',
                text: flattenedText,
                embedding,
                metadata: {
                    isPrivate: false,
                    generatedAt: new Date().toISOString(),
                    model: EMBEDDING_MODEL
                }
            };

            await db.aiDocs.put(doc);
            console.log(`Indexed day context for ${date}`);

        } catch (error) {
            console.error(`Failed to index day ${date}:`, error);
        }
    },

    async reindexAll(): Promise<void> {
        console.log("Starting full reindex...");
        const allBlocks = await db.blocks.toArray();

        // 1. Index individual supported blocks
        for (const block of allBlocks) {
            await this.indexBlock(block);
        }

        // 2. Index daily contexts
        // Get unique days
        const days = new Set(allBlocks.filter(b => b.scope.type === 'day').map(b => b.scope.id));
        for (const date of days) {
            await this.indexDay(date);
        }

        console.log("Full reindex complete.");
    }
};
