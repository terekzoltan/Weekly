import { Block } from '@/lib/models/types';

/**
 * Generates a normalized, lowercase string containing all searchable content from a block.
 * This includes title, content, list items, and habit data values.
 */
export function generateSearchText(block: Block): string {
    const parts: string[] = [];

    // 1. Title
    if (block.title) parts.push(block.title);

    // 2. Content (Text blocks, journals)
    if (block.content) parts.push(block.content);

    // 3. Items (Checklists, Todos)
    if (block.items && Array.isArray(block.items)) {
        block.items.forEach(item => {
            if (item.text) parts.push(item.text);
        });
    }

    // 4. Data (Habits, Custom data)
    if (block.data) {
        // We only want leaf values that are strings or numbers
        const extractValues = (obj: unknown) => {
            if (!obj) return;
            if (typeof obj === 'string' || typeof obj === 'number') {
                parts.push(String(obj));
                return;
            }
            if (typeof obj === 'object') {
                Object.values(obj).forEach(val => extractValues(val));
            }
        };
        extractValues(block.data);
    }

    // Join, lowerCase, remove accents (normalize)
    return parts
        .join(' ')
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
}
