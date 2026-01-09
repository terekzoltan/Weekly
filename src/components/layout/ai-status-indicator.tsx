'use client';

import { useState, useEffect } from 'react';
import { ollamaService } from '@/lib/ai/ollama-service';
import { Cpu, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export function AiStatusIndicator() {
    const [status, setStatus] = useState<{ ok: boolean; status: string; hasModel?: boolean }>({ ok: false, status: 'checking' });

    useEffect(() => {
        const check = async () => {
            const health = await ollamaService.checkHealth('bge-m3'); // Check for embedding model specifically
            setStatus(health);
        };

        check();
        const interval = setInterval(check, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const getIcon = () => {
        if (status.status === 'checking') return <Cpu className="w-3 h-3 animate-pulse text-gray-400" />;
        if (!status.ok) return <XCircle className="w-3 h-3 text-red-500" />;
        if (status.ok && !status.hasModel) return <AlertCircle className="w-3 h-3 text-amber-500" />;
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    };

    const getMessage = () => {
        if (status.status === 'checking') return 'AI állapot ellenőrzése...';
        if (!status.ok) return 'Ollama: Offline (Futtasd az ollama serve parancsot)';
        if (status.ok && !status.hasModel) return 'Ollama: Online, de hiányzik a bge-m3 modell';
        return 'Ollama: Online & Ready';
    };

    return (
        <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-help"
            title={getMessage()}
        >
            {getIcon()}
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tighter">AI</span>
        </div>
    );
}
