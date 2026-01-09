'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { backupService } from '@/lib/db/backup-service';
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export function BackupControls() {
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleBackup = async () => {
        try {
            setStatus('Exporting...');
            const json = await backupService.exportData();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `weekly-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStatus('Backup downloaded successfully');
            setTimeout(() => setStatus(''), 3000);
        } catch (e) {
            console.error(e);
            setError('Export failed');
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setStatus('Restoring...');
            setError('');
            const text = await file.text();
            await backupService.importData(text);
            setStatus('Data restored successfully! Please refresh.');
            // Optional: window.location.reload();
        } catch (e) {
            console.error(e);
            setError('Restore failed: Invalid file or format');
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Download className="h-5 w-5" /> Export Data
                </h3>
                <p className="text-sm text-gray-500">
                    Download a JSON copy of all your local data. Save this file to backup your habits and journal.
                </p>
                <Button onClick={handleBackup}>Download Backup</Button>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5" /> Restore Data
                </h3>
                <p className="text-sm text-gray-500">
                    Import a previously exported JSON file. This will merge/update existing blocks.
                </p>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="backup-file">Backup File</Label>
                    <Input id="backup-file" type="file" accept=".json" onChange={handleRestore} />
                </div>
            </div>

            {status && (
                <div className="p-3 bg-green-100 text-green-700 rounded flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4" /> {status}
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}
        </div>
    );
}
