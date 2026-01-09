'use client';

import { A4Container } from '@/components/layout/a4-container';
import { NavBar } from '@/components/navigation/nav-bar';
import { BackupControls } from '@/components/settings/backup-controls';
import { SyncControls } from '@/components/settings/sync-controls';
import { AiSettings } from '@/components/settings/ai-settings';

export default function SettingsPage() {
    return (
        <A4Container>
            <div className="mb-8">
                <NavBar />
            </div>

            <header className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Settings
                </h1>
                <p className="text-gray-500">Manage your data and preferences</p>
            </header>

            <section className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Cloud Sync</h2>
                    <SyncControls />
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Data Management</h2>
                    <BackupControls />
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">AI Configuration</h2>
                    <AiSettings />
                </div>
            </section>
        </A4Container>
    );
}
