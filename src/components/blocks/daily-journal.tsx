'use client';

import { useState, useEffect } from 'react';
import { Block } from '@/lib/models/types';
import { BlockWrapper } from './block-wrapper';
import { Textarea } from '@/components/ui/textarea';
import { dayService } from '@/lib/db/day-service';

interface DailyJournalProps {
    block: Block;
}

export function DailyJournal({ block }: DailyJournalProps) {
    const [content, setContent] = useState(block.content || '');
    const [isSaving, setIsSaving] = useState(false);

    // Debounced save
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (content !== (block.content || '')) {
                setIsSaving(true);
                await dayService.updateBlock(block.id, { content });
                setIsSaving(false);
            }
        }, 1000); // Save after 1 second of inactivity

        return () => clearTimeout(timer);
    }, [content, block.id, block.content]);

    return (
        <BlockWrapper title={block.title || 'Journal'} kind={block.kind}>
            <div className="relative">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your thoughts here..."
                    className="min-h-[150px] resize-none"
                />
                {isSaving && (
                    <span className="absolute bottom-2 right-2 text-xs text-muted-foreground animate-pulse">
                        Saving...
                    </span>
                )}
            </div>
        </BlockWrapper>
    );
}
