'use client';

import { useState } from 'react';
import { Block, ContentBlock } from '@/lib/models/types';
import { BlockWrapper } from './block-wrapper';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { dayService } from '@/lib/db/day-service';
import { weekService } from '@/lib/db/week-service';

interface ListBlockProps {
    block: Block;
    placeholder?: string;
}

export function ListBlock({ block, placeholder = "Add new item..." }: ListBlockProps) {
    const [items, setItems] = useState<ContentBlock[]>(block.items || []);
    const [newItemText, setNewItemText] = useState('');

    const service = block.scope.type === 'day' ? dayService : weekService;

    const saveItems = async (newItems: ContentBlock[]) => {
        setItems(newItems);
        await service.updateBlock(block.id, { items: newItems });
    };

    const addItem = async () => {
        if (!newItemText.trim()) return;
        const newItem: ContentBlock = {
            id: crypto.randomUUID(),
            kind: 'text',
            text: newItemText
        };
        await saveItems([...items, newItem]);
        setNewItemText('');
    };

    const toggleItem = async (id: string) => {
        const newItems = items.map(item => {
            if (item.id === id) {
                const isChecked = item.text.startsWith('DONE: ');
                const newText = isChecked ? item.text.replace('DONE: ', '') : `DONE: ${item.text}`;
                return { ...item, text: newText };
            }
            return item;
        });
        await saveItems(newItems);
    };

    const removeItem = async (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        await saveItems(newItems);
    };

    return (
        <BlockWrapper title={block.title || block.kind} kind={block.kind}>
            <div className="space-y-2">
                {items.length === 0 && (
                    <p className="text-sm text-muted-foreground/50 py-2 text-center italic">
                        No items yet
                    </p>
                )}

                {items.map((item, index) => {
                    const isChecked = item.text.startsWith('DONE: ');
                    const displayText = isChecked ? item.text.replace('DONE: ', '') : item.text;

                    return (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 group p-2 -mx-2 rounded-lg hover:bg-muted/30 transition-colors duration-200 animate-fade-in-up"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleItem(item.id)}
                            />
                            <span
                                className={`
                                    flex-1 text-sm transition-all duration-200
                                    ${isChecked
                                        ? 'line-through text-muted-foreground/50'
                                        : 'text-foreground'
                                    }
                                `}
                            >
                                {displayText}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => removeItem(item.id)}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    );
                })}

                {/* Add new item */}
                <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                    <Input
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder={placeholder}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        className="h-9"
                    />
                    <Button
                        size="icon-sm"
                        onClick={addItem}
                        className="shrink-0"
                        disabled={!newItemText.trim()}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </BlockWrapper>
    );
}
