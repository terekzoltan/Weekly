
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { syncService } from '@/lib/db/sync-service';
import { User } from '@supabase/supabase-js';

export function SyncControls() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        const email = prompt("Enter email for Sync (OTP will be sent):");
        if (!email) return;

        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin + '/settings'
            }
        });
        setLoading(false);
        if (error) alert(error.message);
        else alert('Check your email for the login link!');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleSync = async () => {
        if (!user) return;
        setStatus('syncing');
        try {
            await syncService.pullChanges(); // Pull first
            await syncService.pushChanges(); // Then push
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Cloud Sync</h3>
                {status === 'success' && <span className="text-green-500 text-sm">Synced!</span>}
                {status === 'error' && <span className="text-red-500 text-sm">Error!</span>}
            </div>

            {!user ? (
                <div>
                    <p className="text-sm text-gray-500 mb-4">Sign in to sync your data across devices.</p>
                    <Button onClick={handleLogin} disabled={loading}>
                        {loading ? 'Sending Link...' : 'Sign In with Email'}
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm">Logged in as: <strong>{user.email}</strong></p>
                    <div className="flex gap-2">
                        <Button onClick={handleSync} disabled={status === 'syncing'}>
                            {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            Sign Out
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
