'use client';

import { useState, useEffect } from 'react';
import { Block } from '@/lib/models/types';
import { BlockWrapper } from './block-wrapper';
import { Textarea } from '@/components/ui/textarea';
import { dayService } from '@/lib/db/day-service';
import { weekService } from '@/lib/db/week-service';
import { Hash } from 'lucide-react';

interface TextBlockProps {
    block: Block;
    placeholder?: string;
    minHeight?: string;
}

export function TextBlock({ block, placeholder = "Write here...", minHeight = "150px" }: TextBlockProps) {
    const [content, setContent] = useState(block.content || '');
    const [isSaving, setIsSaving] = useState(false);

    const service = block.scope.type === 'day' ? dayService : weekService;

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (content !== (block.content || '')) {
                setIsSaving(true);
                await service.updateBlock(block.id, { content });
                setIsSaving(false);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [content, block.id, block.content, service]);

    return (
        <BlockWrapper title={block.title || block.kind} kind={block.kind}>
            <div className="relative group">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    className="resize-none scrollbar-thin"
                    style={{ minHeight }}
                />

                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {/* Smart Tagging Button */}
                    <button
                        onClick={async () => {
                            if (!content.trim()) return;
                            setIsSaving(true); // Re-use saving state for loading visual or add new one
                            try {
                                const { ollamaService } = await import('@/lib/ai/ollama-service');
                                const res = await ollamaService.generateCompletion({
                                    model: 'llama3.2',
                                    prompt: `Task: Extract 1-3 relevant short hashtags for the following journal entry. Output ONLY the hashtags separated by spaces (e.g. #gym #work). Do not add explanations.\n\nText: "${content}"`,
                                    system: "You are a tag extractor. Output only hashtags."
                                });
                                const tags = res.response.trim();
                                if (tags && tags.includes('#')) {
                                    const newContent = content + '\n' + tags;
                                    setContent(newContent);
                                    // Trigger save immediately
                                    await service.updateBlock(block.id, { content: newContent });
                                }
                            } catch (e) {
                                console.error("Tagging failed", e);
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                        className="p-1.5 rounded-full bg-indigo-50 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        title="AI Smart Tags"
                    >
                        <Hash className="w-3.5 h-3.5" />
                    </button>

                    {isSaving && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse"></span>
                            <span className="text-xs text-primary animate-pulse">
                                Saving...
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </BlockWrapper>
    );
}
