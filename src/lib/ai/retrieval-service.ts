import { db } from '@/lib/db/db';
import { AIDocument } from '@/lib/models/ai-types';
import { ollamaService } from './ollama-service';

const EMBEDDING_MODEL = 'bge-m3';

export interface SearchFilters {
    includePrivate: boolean;
    dateRange?: { start: string; end: string }; // ISO dates
}

export interface SearchResult {
    doc: AIDocument;
    score: number;
}

// Simple cosine similarity (or dot product if vectors are normalized)
function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const retrievalService = {
    async search(query: string, filters: SearchFilters, topK: number = 20): Promise<SearchResult[]> {
        // 1. Generate Query Embedding
        const queryEmbedding = await ollamaService.generateEmbedding(query, EMBEDDING_MODEL);

        // 2. Fetch Candidates
        // MVP: Fetch ALL docs and filter in memory.
        // For < 10,000 docs this is surprisingly fast in JS (~10-50ms).
        // Dexie also supports iterating with specific index if we had one, but we scan for similarity.
        let candidates = await db.aiDocs.toArray();

        // 3. Apply Filters
        if (!filters.includePrivate) {
            candidates = candidates.filter(doc => !doc.metadata.isPrivate);
        }

        if (filters.dateRange) {
            candidates = candidates.filter(doc => {
                // ScopeId is usually yyyy-mm-dd or yyyy-Www
                // Simple string compare works for ISO yyyy-mm-dd
                if (doc.scopeType === 'day') {
                    return doc.scopeId >= filters.dateRange!.start && doc.scopeId <= filters.dateRange!.end;
                }
                return true; // Keep weekly/other for now or implement week conversion logic
            });
        }

        // 4. Score and Rank
        const scored: SearchResult[] = candidates.map(doc => {
            let score = cosineSimilarity(queryEmbedding, doc.embedding);

            // "Budget Routing" Boost: Prefer summaries over raw text for higher-level context
            if (doc.kind.includes('summary')) {
                score *= 1.25;
            }

            return { doc, score };
        });

        // Sort descending
        scored.sort((a, b) => b.score - a.score);

        return scored.slice(0, topK);
    }
};
