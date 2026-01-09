export interface AIDocument {
    id: string; // Matches block.id
    blockId: string;
    scopeId: string; // date or weekId
    scopeType: 'day' | 'week' | 'year';
    kind: string;
    text: string; // Flattened text content
    embedding: number[];
    metadata: {
        isPrivate: boolean;
        generatedAt: string;
        model: string;
    };
}
