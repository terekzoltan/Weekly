'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { A4Container } from '@/components/layout/a4-container';
import { NavBar } from '@/components/navigation/nav-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { retrievalService, SearchResult } from '@/lib/ai/retrieval-service';
import { ollamaService } from '@/lib/ai/ollama-service';
import { openRouterService } from '@/lib/ai/openrouter-service';
import { Search, Sparkles, Lock, Unlock, RefreshCw, Zap, CloudLightning, Send, Trash2, History, Database, User, Bot, PlusCircle } from 'lucide-react';
import { indexingService } from '@/lib/ai/indexing-service';
import { formatReadableDate } from '@/lib/utils/date-utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isCloud?: boolean;
    evidence?: SearchResult[];
    timestamp: number;
}

export default function AskPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // Toggles
    const [useMemory, setUseMemory] = useState(true);
    const [useHistory, setUseHistory] = useState(true);
    const [includePrivate, setIncludePrivate] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('weekly_chat_history');
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        localStorage.setItem('weekly_chat_history', JSON.stringify(messages));
    }, [messages]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: input.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
            let context = '';
            let evidence: SearchResult[] = [];

            // 1. RAG (Memory) Step
            if (useMemory) {
                const results = await retrievalService.search(userMsg.content, { includePrivate });
                evidence = results;
                if (results.length > 0) {
                    context = results.map(r => `[${r.doc.scopeId} - ${r.doc.kind}]: ${r.doc.text}`).join('\n\n');
                }
            }

            // 2. Prepare Messages for LLM
            let llmMessages: { role: string; content: string }[] = [];

            // System Prompt
            const systemPrompt = "You are a helpful, empathetic, and intelligent life assistant named 'Weekly AI'. Answer the user's questions based on the provided context (if any) and your general knowledge. Answer in Hungarian.";

            // If History is ON, include previous context window (limited to last 10 for basic safety)
            if (useHistory) {
                const historyWindow = messages.slice(-10).map(m => ({
                    role: m.role,
                    content: m.content
                }));
                llmMessages = [...historyWindow];
            }

            // Current User Message + RAG Context
            let finalUserContent = userMsg.content;
            if (context) {
                finalUserContent = `Kérdés: ${userMsg.content}\n\nReleváns MEMÓRIA (naplórészletek):\n${context}\n\nHasználd a fenti információt a válaszodban, ha releváns.`;
            }

            llmMessages.push({ role: 'user', content: finalUserContent });


            // 3. Select Provider (Cloud vs Local)
            const useCloud = localStorage.getItem('weekly_use_cloud_for_summaries') === 'true'; // Reusing this setting or we could add a specific Chat Cloud Toggle
            // Actually, let's respect the general "Cloud Upgrade" idea. Maybe Chat should default to Cloud if enabled? 
            // Let's check the setting.

            let responseContent = '';
            let isCloudResponse = false;

            if (useCloud) {
                const cloudModel = localStorage.getItem('weekly_openrouter_model') || 'google/gemini-2.0-flash-001';
                const res = await openRouterService.generateCompletion({
                    model: cloudModel,
                    prompt: finalUserContent, // OpenRouter service might need refactor to accept message array, currently takes prompt string + system.
                    // Ideally we should update openRouterService to take messages.
                    // For now, let's stick to prompt-based if passing full history is complex with current service signature,
                    // BUT to support history toggle properly we really need message history.
                    // Hack: Join messages for prompt if using simple service.
                    // Revised OpenRouterService call:
                    // It accepts 'prompt' and optional 'system'. It constructs [system, user] array.
                    // This limits multi-turn chat. 
                    // Let's just concatenate history into the prompt for this Sprint MVP.
                    system: systemPrompt
                });
                // Wait, OpenRouterService implementation (viewed earlier) takes `prompt` string and sends `[{role: 'user', content: prompt}]`. 
                // It doesn't support chat history array input yet.
                // To support History correctly, I should ideally update the service.
                // ALTERNATIVE: Concatenate history into the prompt text.
                // "History:\nUser: ...\nAssistant: ...\nCurrent: ..."
                // This works reasonably well for simple chat.

                // Let's re-construct the prompt for the service call:
                let fullPrompt = finalUserContent;
                if (useHistory && messages.length > 0) {
                    const historyText = messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
                    fullPrompt = `Previous Conversation:\n${historyText}\n\n${finalUserContent}`;
                }

                const ans = await openRouterService.generateCompletion({
                    model: cloudModel,
                    prompt: fullPrompt,
                    system: systemPrompt
                });
                responseContent = ans;
                isCloudResponse = true;

            } else {
                // Local Ollama
                // OllamaService `generateCompletion` also takes prompt string.
                // Same strategy: Concat history.
                let fullPrompt = finalUserContent;
                if (useHistory && messages.length > 0) {
                    const historyText = messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
                    fullPrompt = `Previous Conversation:\n${historyText}\n\n${finalUserContent}`;
                }

                const res = await ollamaService.generateCompletion({
                    model: 'llama3.2',
                    prompt: fullPrompt,
                    system: systemPrompt,
                    options: { temperature: 0.7 }
                });
                responseContent = res.response;
            }

            const assistantMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: responseContent,
                isCloud: isCloudResponse,
                evidence: useMemory ? evidence : undefined,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Hiba történt a válasz generálása közben.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleClear = () => {
        if (confirm("Biztosan törlöd a beszélgetést?")) {
            setMessages([]);
        }
    };

    return (
        <A4Container>
            <NavBar currentDate={new Date().toISOString().split('T')[0]} />

            <div className="flex flex-col h-[600px] border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-900">
                {/* Header */}
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Chat with Big Brain</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleClear} title="Clear Chat">
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-50">
                            <Bot className="w-12 h-12 mb-2" />
                            <p>Kezdj el beszélgetni...</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                                }`}>
                                <div className="whitespace-pre-wrap text-sm">
                                    {msg.content}
                                </div>

                                {/* Evidence Footer */}
                                {msg.evidence && msg.evidence.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                        <p className="text-[10px] uppercase tracking-wider opacity-60 mb-2 flex items-center gap-1">
                                            <Database className="w-3 h-3" />
                                            Used Memories:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.evidence.slice(0, 3).map((e, idx) => {
                                                const href = e.doc.scopeType === 'day' ? `/day/${e.doc.scopeId}` :
                                                    e.doc.scopeType === 'week' ? `/week/${e.doc.scopeId}` :
                                                        e.doc.scopeType === 'year' ? `/year/${e.doc.scopeId}` : '#';

                                                return (
                                                    <Link key={idx} href={href} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 hover:scale-105 transition-all" title={e.doc.text.substring(0, 100)}>
                                                        {formatReadableDate(e.doc.scopeId)} ({e.doc.kind})
                                                    </Link>
                                                );
                                            })}
                                            {msg.evidence.length > 3 && (
                                                <span className="text-[10px] text-gray-400">+{msg.evidence.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-1 flex justify-between items-center opacity-50 text-[10px]">
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {msg.isCloud && <CloudLightning className="w-3 h-3 text-yellow-500 ml-2" />}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Controls & Input */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t space-y-3">
                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-4 items-center justify-between text-xs text-gray-600 dark:text-gray-400 px-1">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
                                <input type="checkbox" checked={useMemory} onChange={e => setUseMemory(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Use Memory (RAG)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
                                <input type="checkbox" checked={useHistory} onChange={e => setUseHistory(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Use History</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer hover:text-amber-600 transition-colors">
                                <input type="checkbox" checked={includePrivate} onChange={e => setIncludePrivate(e.target.checked)} className="rounded text-amber-600 focus:ring-amber-500" />
                                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Include Private</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Type your question..."
                            className="flex-1"
                        />
                        <Button onClick={handleSend} disabled={!input.trim() || isThinking} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </A4Container>
    );
}

function Loader2(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}

