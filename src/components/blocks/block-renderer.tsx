'use client';

import { Block } from '@/lib/models/types';
import { TextBlock } from '@/components/blocks/text-block';
import { ListBlock } from '@/components/blocks/list-block';
import { DailyHabits } from '@/components/blocks/daily-habits';
import { SummaryBlock } from '@/components/blocks/ai/summary-block';
import { BlockErrorBoundary } from '@/components/ui/block-error-boundary';

interface BlockRendererProps {
    block: Block;
    allBlocks?: Block[]; // Optional context for summarizers
    placeholder?: string;
}

export function BlockRenderer({ block, allBlocks, placeholder }: BlockRendererProps) {
    const renderContent = () => {
        switch (block.kind) {
            case 'daily-habits':
                return <DailyHabits block={block} />;

            case 'daily-journal':
            case 'weekly-journal':
            case 'meta-update':
                return <TextBlock block={block} placeholder={placeholder || "Write here..."} minHeight={block.kind.includes('weekly') ? "300px" : undefined} />;

            case 'daily-checklist':
            case 'daily-todo':
            case 'weekly-todo':
            case 'important-concepts':
            case 'games':
            case 'yearly-goals':
                return <ListBlock block={block} placeholder={placeholder || "Add item..."} />;

            case 'daily-summary-public':
            case 'daily-summary-private':
            case 'weekly-summary':
            case 'monthly-summary':
            case 'yearly-summary':
                // Check if it's a text block summary or the AI summary block
                // Usually 'yearly-summary' is a text block for user reflection, 
                // while 'daily/weekly/monthly' are AI generated.
                // Based on schema, 'yearly-summary' is manually written currently? 
                // Let's assume AI blocks use SummaryBlock, manual textual summaries user TextBlock.
                // Adjusting logic based on existing usage:
                if (block.kind === 'yearly-summary') {
                    return <TextBlock block={block} minHeight="400px" placeholder={placeholder || "Reflect on your year..."} />;
                }
                return <SummaryBlock block={block} allBlocks={allBlocks || []} />;

            default:
                return (
                    <div className="p-4 border border-dashed border-muted-foreground/30 rounded-xl bg-muted/20">
                        <p className="text-sm text-muted-foreground">Unknown block type: {block.kind}</p>
                    </div>
                );
        }
    };

    return (
        <BlockErrorBoundary blockId={block.id}>
            {renderContent()}
        </BlockErrorBoundary>
    );
}
