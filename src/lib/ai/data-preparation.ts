import { Block } from '../models/types';
import { DailyHabitsSchema } from '../models/schema';

export function flattenDailyData(blocks: Block[], type: 'public' | 'private'): string {
    let output = '';

    // 1. Process Habits
    const habitsBlock = blocks.find(b => b.kind === 'daily-habits');
    if (habitsBlock && habitsBlock.data) {
        output += `[NAPI ADATOK]\n`;
        const parseResult = DailyHabitsSchema.safeParse(habitsBlock.data);
        if (parseResult.success) {
            const data = parseResult.data;
            if (data.sleepLength) output += `- Alvás: ${data.sleepLength} óra\n`;
            if (data.prog) output += `- Produktivitás: ${data.prog}/10\n`;
            if (data.sport) output += `- Sport: ${data.sport}\n`;
            if (data.med) output += `- Meditáció: ${data.med} perc\n`;
            // Add other habit fields as needed
        }
        output += '\n';
    }

    // 2. Process Todos
    const todoBlock = blocks.find(b => b.kind === 'daily-todo');
    if (todoBlock && todoBlock.items && todoBlock.items.length > 0) {
        output += `[TEENDŐK]\n`;
        // We assume items have a 'checked' state in their text or separate metadata, 
        // but looking at valid schema, ContentBlock is {id, kind, text}.
        // If 'text' contains markdown checkboxes, we can parse them. 
        // For now, list all items logic. 

        // Better logic if we have access to "checked" state. 
        // Assuming the text might be "- [x] Task" or just "Task" depending on implementation.
        // Let's just dump the text.
        todoBlock.items.forEach(item => {
            output += `- ${item.text}\n`;
        });
        output += '\n';
    }

    // 3. Process Journal (PRIVATE ONLY)
    if (type === 'private') {
        const journalBlock = blocks.find(b => b.kind === 'daily-journal');
        if (journalBlock && journalBlock.content) {
            output += `[NAPLÓ]\n${journalBlock.content}\n`;
        }
        // Also include item-based journal entries if any
        if (journalBlock && journalBlock.items) {
            journalBlock.items.forEach(item => {
                output += `${item.text}\n`;
            });
        }
    }

    return output;
}

export function flattenWeeklyData(blocks: Block[], type: 'public' | 'private'): string {
    let output = '';

    // 1. Weekly Goals/Todo
    const weeklyTodo = blocks.find(b => b.kind === 'weekly-todo');
    if (weeklyTodo && weeklyTodo.items && weeklyTodo.items.length > 0) {
        output += `[HETI CÉLOK]\n`;
        weeklyTodo.items.forEach(item => output += `- ${item.text}\n`);
        output += '\n';
    }

    // 2. Identify Daily Summaries
    // We want to group by day.
    const summaries = blocks.filter(b => b.kind === 'daily-summary-public' || (type === 'private' && b.kind === 'daily-summary-private'));

    // Sort by date (scope.id is 'yyyy-mm-dd')
    summaries.sort((a, b) => a.scope.id.localeCompare(b.scope.id));

    if (summaries.length > 0) {
        output += `[NAPI ÖSSZEFOGLALÓK]\n`;
        summaries.forEach(s => {
            const date = s.scope.id;
            output += `### ${date} (${s.kind.includes('public') ? 'Publikus' : 'Privát'}):\n${s.content}\n\n`;
        });
    } else {
        // Fallback: If no summaries exist, we might want to suggest generating them?
        // Or we could try to aggregate raw habits if desperate, but for "Fractal" logic we prefer summaries.
        output += `(Nincsenek elérhető napi összefoglalók ehhez a héthez.)\n`;
    }

    // 3. Weekly Journal (Private Only)
    if (type === 'private') {
        const journal = blocks.find(b => b.kind === 'weekly-journal');
        if (journal && journal.content) {
            output += `[HETI NAPLÓ/GONDOLATOK]\n${journal.content}\n`;
        }
    }

    return output;
}

export function flattenMonthlyData(blocks: Block[], type: 'public' | 'private'): string {
    let output = '';

    // Sort by week ID (e.g., 2025-W01)
    const summaries = blocks.filter(b => b.kind === 'weekly-summary');
    summaries.sort((a, b) => a.scope.id.localeCompare(b.scope.id));

    if (summaries.length > 0) {
        output += `[HETI ÖSSZEFOGLALÓK]\n`;
        summaries.forEach(s => {
            output += `### ${s.scope.id}:\n${s.content}\n\n`;
        });
    } else {
        output += `(Nincsenek elérhető heti összefoglalók ehhez a hónaphoz.)`;
    }

    return output;
}
