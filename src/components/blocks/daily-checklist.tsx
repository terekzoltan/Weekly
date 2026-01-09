'use client';

import { useState } from 'react';
import { Block, ContentBlock } from '@/lib/models/types';
import { BlockWrapper } from './block-wrapper';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { dayService } from '@/lib/db/day-service';

interface DailyChecklistProps {
    block: Block;
}

export function DailyChecklist({ block }: DailyChecklistProps) {
    const [items, setItems] = useState<ContentBlock[]>(block.items || []);
    const [newItemText, setNewItemText] = useState('');

    const saveItems = async (newItems: ContentBlock[]) => {
        setItems(newItems);
        await dayService.updateBlock(block.id, { items: newItems });
    };

    const addItem = async () => {
        if (!newItemText.trim()) return;
        const newItem: ContentBlock = {
            id: crypto.randomUUID(),
            kind: 'text', // Using 'text' for now, but semantically it's a checklist item
            text: newItemText
        };
        // In a real checklist, we'd need a 'checked' state. 
        // For Sprint 1, let's assume 'text' starting with '[x] ' is checked, or add a field to ContentBlock later.
        // Wait, the spec said ContentBlock has kind/text. 
        // Let's use a convention: if kind is 'checkbox', it has a checked state?
        // Or just store it in the text for now like markdown: "[ ] Task" vs "[x] Task"
        // Actually, let's just add a 'checked' property to ContentBlock in the model or cast it here.
        // For strict adherence to current model, I will use a local convention or update model.
        // Let's update the model to support 'checked' property for checklist items?
        // The user said: "ContentBlock: id, kind, text".
        // I will stick to the model and use a simple prefix convention for now to avoid breaking changes mid-sprint, 
        // OR I can just add an optional 'checked' field to the type definition if I can.
        // Let's use the prefix convention for simplicity in Sprint 1: "DONE: " prefix.

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
        <BlockWrapper title={block.title || 'Checklist'} kind={block.kind}>
            <div className="space-y-2">
                {items.map((item) => {
                    const isChecked = item.text.startsWith('DONE: ');
                    const displayText = isChecked ? item.text.replace('DONE: ', '') : item.text;

                    return (
                        <div key={item.id} className="flex items-center gap-2 group">
                            <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleItem(item.id)}
                            />
                            <span className={`flex-1 text-sm ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                                {displayText}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => removeItem(item.id)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                })}

                <div className="flex items-center gap-2 mt-4">
                    <Input
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add new item..."
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                    <Button size="icon" onClick={addItem}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </BlockWrapper>
    );
}
