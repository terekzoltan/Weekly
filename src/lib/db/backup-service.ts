import { db } from './db';

export const backupService = {
    async exportData(): Promise<string> {
        const blocks = await db.blocks.toArray();
        const backup = {
            version: 1,
            timestamp: new Date().toISOString(),
            blocks,
        };
        return JSON.stringify(backup, null, 2);
    },

    async importData(jsonString: string): Promise<void> {
        try {
            const backup = JSON.parse(jsonString);
            if (!backup.blocks || !Array.isArray(backup.blocks)) {
                throw new Error('Invalid backup format');
            }

            // Bulk put (upsert) blocks
            await db.transaction('rw', db.blocks, async () => {
                await db.blocks.bulkPut(backup.blocks);
            });
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }
};
