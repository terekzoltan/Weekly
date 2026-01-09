
import { db } from './db';
import { supabase } from '@/lib/supabase/client';
import { Block } from '@/lib/models/types';

export const syncService = {
    async pushChanges() {
        const user = await supabase.auth.getUser();
        if (!user.data.user) return; // Not logged in

        // For MVP: Simple "Push All" strategy or "Push Dirty".
        // Let's implement a simple strategy: 
        // 1. Get all blocks from local DB.
        // 2. Upsert them to Supabase 'blocks' table.
        // Optimization: In real app, track 'dirty' flags. 
        // Here we can use 'updatedAt' comparison if we pull first.

        const allBlocks = await db.blocks.toArray();
        if (allBlocks.length === 0) return;

        const { error } = await supabase
            .from('blocks')
            .upsert(allBlocks.map(b => ({
                id: b.id,
                user_id: user.data.user?.id,
                scope_type: b.scope.type,
                scope_id: b.scope.id,
                kind: b.kind,
                content: b.content, // Encrypt here if needed
                title: b.title,
                items: b.items,
                data: b.data,
                created_at: b.createdAt,
                updated_at: b.updatedAt,
                search_text: b.searchText
            })));

        if (error) {
            console.error('Sync Push Error:', error);
            throw error;
        }
    },

    async pullChanges() {
        const user = await supabase.auth.getUser();
        if (!user.data.user) return;

        const { data, error } = await supabase
            .from('blocks')
            .select('*');

        if (error) {
            console.error('Sync Pull Error:', error);
            throw error;
        }

        if (data && data.length > 0) {
            await db.transaction('rw', db.blocks, async () => {
                for (const row of data) {
                    // Map back to local Block structure
                    const block: Block = {
                        id: row.id,
                        scope: { type: row.scope_type, id: row.scope_id },
                        kind: row.kind,
                        title: row.title,
                        content: row.content,
                        items: row.items,
                        data: row.data,
                        createdAt: row.created_at,
                        updatedAt: row.updated_at,
                        searchText: row.search_text
                    };

                    // Upsert to local
                    await db.blocks.put(block);
                }
            });
        }
    }
};
