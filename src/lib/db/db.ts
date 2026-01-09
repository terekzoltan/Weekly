import Dexie, { Table } from 'dexie';
import { Block } from '@/lib/models/types';
import { generateSearchText } from '@/lib/utils/search-utils';
import { AIDocument } from '@/lib/models/ai-types';

export class WeeklyDb extends Dexie {
    blocks!: Table<Block, string>;
    aiDocs!: Table<AIDocument, string>;

    constructor() {
        super('WeeklyDb');

        // Version 1
        this.version(1).stores({
            blocks: 'id, kind, scope.type, [scope.type+kind], [scope.type+scope.id], createdAt'
        });

        // Version 2: Add searchText index & populate it
        this.version(2).stores({
            blocks: 'id, kind, scope.type, [scope.type+kind], [scope.type+scope.id], createdAt, searchText'
        }).upgrade(async (trans) => {
            // Upgrade script: iterate all blocks and add searchText
            await trans.table('blocks').toCollection().modify((block: Block) => {
                block.searchText = generateSearchText(block);
            });
        });

        // Version 3: Add aiDocs table for RAG
        this.version(3).stores({
            blocks: 'id, kind, scope.type, [scope.type+kind], [scope.type+scope.id], createdAt, searchText',
            aiDocs: 'id, blockId, scopeId, kind, metadata.isPrivate'
        });

        // Add hooks to automatically update searchText on creates and updates
        this.blocks.hook('creating', (_primKey, obj) => {
            obj.searchText = generateSearchText(obj);
        });

        this.blocks.hook('updating', (modifications, _primKey, obj) => {
            const newObj = { ...obj, ...modifications } as Block;
            const newSearchText = generateSearchText(newObj);
            return { searchText: newSearchText };
        });
    }
}

export const db = new WeeklyDb();
