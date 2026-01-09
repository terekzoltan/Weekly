'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/db';
import { A4Container } from '@/components/layout/a4-container';
import { NavBar } from '@/components/navigation/nav-bar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Moon, Brain, Coffee, Hash } from 'lucide-react';

interface ChartData {
    date: string;
    shortDate: string;
    sleepLength: number;
    prog: number;
    nap: number;
    kaj: number;
    med: number;
    tags: string[];
}

export default function StatsPage() {
    const router = useRouter();
    const [data, setData] = useState<ChartData[]>([]);
    const [filteredData, setFilteredData] = useState<ChartData[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            // Fetch habits and journals
            const habitBlocks = await db.blocks.where('kind').equals('daily-habits').toArray();
            const journalBlocks = await db.blocks.where('kind').equals('daily-journal').toArray();

            // Create a map of date -> tags
            const dateTagsMap: Record<string, string[]> = {};
            journalBlocks.forEach(b => {
                if (b.scope.type === 'day' && b.content) {
                    // Extract #tags
                    const tags = b.content.match(/#[a-zA-Z0-9_]+/g)?.map(t => t.toLowerCase()) || [];
                    if (tags.length > 0) {
                        if (!dateTagsMap[b.scope.id]) dateTagsMap[b.scope.id] = [];
                        dateTagsMap[b.scope.id].push(...tags);
                    }
                }
            });

            // Process habit blocks
            const processed = habitBlocks
                .filter(b => b.scope.type === 'day' && b.data)
                .sort((a, b) => (a.scope.id > b.scope.id ? 1 : -1))
                .map(b => ({
                    date: b.scope.id,
                    shortDate: format(parseISO(b.scope.id), 'MM-dd'),
                    sleepLength: parseFloat(String(b.data?.sleepLength || '0')) || 0,
                    prog: parseInt(String(b.data?.prog || '0')) || 0,
                    nap: parseInt(String(b.data?.nap || '0')) || 0,
                    kaj: parseInt(String(b.data?.kaj || '0')) || 0,
                    med: parseInt(String(b.data?.med || '0')) || 0,
                    tags: dateTagsMap[b.scope.id] || []
                }))
                .slice(-60); // Increase to last 60 days for better trends

            // Collect unique tags
            const allTags = new Set<string>();
            Object.values(dateTagsMap).flat().forEach(t => allTags.add(t));

            setAvailableTags(Array.from(allTags).sort());
            setData(processed);
            setFilteredData(processed);
            setLoading(false);
        }

        loadData();
    }, []);

    useEffect(() => {
        if (selectedTag === 'all') {
            setFilteredData(data);
        } else {
            setFilteredData(data.filter(d => d.tags.includes(selectedTag)));
        }
    }, [selectedTag, data]);

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const date = data.activePayload[0].payload.date;
            router.push(`/day/${date}`);
        }
    };

    return (
        <A4Container>
            <div className="mb-4">
                <NavBar />
            </div>

            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Activity className="w-8 h-8 text-indigo-500" />
                        Bio-Dashboard
                    </h1>
                    <p className="text-gray-500">Correlation trends & Habits.</p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border shadow-sm">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <select
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                        className="w-[180px] border-none shadow-none h-8 bg-transparent text-sm focus:ring-0 cursor-pointer"
                    >
                        <option value="all">All Data</option>
                        {availableTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                </div>
            </header>

            {loading ? (
                <div className="h-64 flex items-center justify-center text-gray-400 animate-pulse">Loading analytics...</div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KPICard title="Avg Sleep" value={calculateAverage(filteredData, 'sleepLength').toFixed(1) + 'h'} icon={Moon} color="text-indigo-500" />
                        <KPICard title="Avg Prod" value={calculateAverage(filteredData, 'prog').toFixed(1)} icon={Activity} color="text-emerald-500" />
                        <KPICard title="Avg Mood" value={calculateAverage(filteredData, 'kaj').toFixed(1)} icon={Coffee} color="text-amber-500" />
                        <KPICard title="Days" value={filteredData.length.toString()} icon={Brain} color="text-gray-500" />
                    </div>

                    {/* Sleep vs Productivity */}
                    <Card className="shadow-md border-indigo-100 dark:border-indigo-900/50 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Sleep vs Productivity Correlation</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={filteredData} onClick={handleChartClick} className="cursor-pointer">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="shortDate" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" domain={[0, 12]} orientation="left" stroke="#6366f1" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="right" domain={[0, 10]} orientation="right" stroke="#10b981" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ color: '#6b7280', marginBottom: '0.5rem' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="sleepLength" stroke="#6366f1" strokeWidth={3} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 6 }} name="Sleep (h)" animationDuration={1000} />
                                    <Line yAxisId="right" type="monotone" dataKey="prog" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 6 }} name="Productivity" animationDuration={1000} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Mood & Energy */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Daily Ratings Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredData} onClick={handleChartClick}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="shortDate" tick={{ fontSize: 10 }} />
                                        <YAxis domain={[0, 10]} fontSize={10} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="nap" stroke="#f59e0b" strokeWidth={2} dot={false} name="Day Rating" />
                                        <Line type="monotone" dataKey="kaj" stroke="#ef4444" strokeWidth={2} dot={false} name="Energy/Food" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Meditation Minutes</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredData} onClick={handleChartClick}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="shortDate" tick={{ fontSize: 10 }} />
                                        <YAxis fontSize={10} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="med" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Meditation" maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            )}
        </A4Container>
    );
}

function calculateAverage(data: ChartData[], key: keyof ChartData): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, curr) => acc + (curr[key] as number), 0);
    return sum / data.length;
}

function KPICard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className="border-none shadow-sm bg-gray-50/50 dark:bg-gray-800/50">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold mt-1 text-gray-700 dark:text-gray-200">{value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </CardContent>
        </Card>
    )
}
