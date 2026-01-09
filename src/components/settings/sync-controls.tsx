
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
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    const handleSendOtp = async () => {
        if (!email) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true, // Create user if not exists
                // We don't rely on the link anymore, but it's still sent as fallback
            }
        });
        setLoading(false);
        if (error) {
            alert(error.message);
        } else {
            setStep('otp');
            // Don't alert standard message, UI will change
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || !email) return;
        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
        });
        setLoading(false);
        if (error) {
            alert(error.message);
        } else {
            setStep('email'); // Reset step for next time/logout logic handled by auth listener
            setOtp('');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setStep('email');
        setEmail('');
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
        <div className="p-4 border rounded-lg bg-card shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium flex items-center gap-2">
                    Cloud Sync
                    {status === 'success' && <span className="text-green-500 text-xs px-2 py-0.5 bg-green-500/10 rounded-full animate-pulse">Synced</span>}
                    {status === 'error' && <span className="text-destructive text-xs px-2 py-0.5 bg-destructive/10 rounded-full">Error</span>}
                </h3>
            </div>

            {!user ? (
                <div className="space-y-4">
                    {step === 'email' ? (
                        <>
                            <p className="text-sm text-muted-foreground">Sign in to sync your data across devices.</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                                />
                                <Button onClick={handleSendOtp} disabled={loading} size="sm">
                                    {loading ? 'Sending...' : 'Send Code'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">Check your email for the 6-digit code.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 tracking-widest text-center"
                                    maxLength={6}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                                />
                                <Button onClick={handleVerifyOtp} disabled={loading} size="sm">
                                    {loading ? 'Verifying...' : 'Login'}
                                </Button>
                            </div>
                            <button
                                onClick={() => setStep('email')}
                                className="text-xs text-muted-foreground hover:text-primary hover:underline w-full text-center mt-2"
                            >
                                Change email
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground break-all">Logged in as: <span className="font-mono text-foreground">{user.email}</span></p>
                    <div className="flex gap-2">
                        <Button onClick={handleSync} disabled={status === 'syncing'} className="flex-1" size="sm">
                            {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        <Button variant="outline" onClick={handleLogout} size="sm">
                            Sign Out
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
