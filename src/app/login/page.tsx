'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Pill, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push('/dashboard');
            router.refresh();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0066CC] via-[#004C99] to-[#003366] flex flex-col items-center justify-center p-4">
            {/* Background pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-white/5 to-transparent rounded-full" />
                <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-white/5 to-transparent rounded-full" />
            </div>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 relative">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
                    <Pill className="w-8 h-8 text-[#0066CC]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">PharmaScan AI</h1>
                    <p className="text-white/60 text-sm">Gestión de Inventario</p>
                </div>
            </div>

            <Card className="w-full max-w-md relative">
                <CardHeader className="text-center pb-2">
                    <h2 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        Iniciar Sesión
                    </h2>
                    <p className="text-[#64748B] text-sm mt-1">
                        Ingresa a tu cuenta para continuar
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                label="Correo Electrónico"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Mail className="absolute right-4 top-10 w-5 h-5 text-[#94A3B8]" />
                        </div>

                        <div className="relative">
                            <Input
                                id="password"
                                type="password"
                                label="Contraseña"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Lock className="absolute right-4 top-10 w-5 h-5 text-[#94A3B8]" />
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full"
                            size="lg"
                        >
                            Iniciar Sesión
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#E2E8F0] dark:border-[#334155]" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-[#1E293B] px-2 text-[#64748B]">
                                    o continúa con
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </Button>

                        <p className="text-center text-sm text-[#64748B] mt-6">
                            ¿No tienes cuenta?{' '}
                            <Link
                                href="/register"
                                className="text-[#0066CC] hover:underline font-medium"
                            >
                                Regístrate
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
