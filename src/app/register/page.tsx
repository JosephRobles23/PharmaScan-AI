'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Pill, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Aurora from '@/components/Aurora/aurora';

export default function RegisterPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error al registrarse';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] relative overflow-hidden flex flex-col items-center justify-center p-4">

            <div className="absolute inset-0 z-0 opacity-50">
                <Aurora
                    colorStops={["#000000", "#FFFFFF", "#808080"]}
                    speed={1}
                    amplitude={1.8}
                />
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                {/* Logo */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
                        <Image
                            src="/pharmascan-logo.png"
                            alt="PharmaScan AI"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">PharmaScan AI</h1>
                        <p className="text-[#8E8E93] text-sm">Gestión de Inventario</p>
                    </div>
                </div>

                <Card className="w-full max-w-md relative">
                    <CardHeader className="text-center pb-2">
                        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                            Crear Cuenta
                        </h2>
                        <p className="text-[#64748B] text-sm mt-1">
                            Regístrate para comenzar
                        </p>
                    </CardHeader>

                    <CardContent>
                        {success ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-2">
                                    ¡Revisa tu correo!
                                </h3>
                                <p className="text-[#64748B] text-sm mb-4">
                                    Hemos enviado un enlace de confirmación a <strong>{email}</strong>
                                </p>
                                <Link href="/login">
                                    <Button variant="secondary">
                                        Ir a Iniciar Sesión
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-4">
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
                                        placeholder="Mínimo 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Lock className="absolute right-4 top-10 w-5 h-5 text-[#94A3B8]" />
                                </div>

                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        label="Confirmar Contraseña"
                                        placeholder="Repite tu contraseña"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    <User className="w-5 h-5 mr-2" />
                                    Crear Cuenta
                                </Button>

                                <p className="text-center text-sm text-[#64748B] mt-6">
                                    ¿Ya tienes cuenta?{' '}
                                    <Link
                                        href="/login"
                                        className="text-[#0066CC] hover:underline font-medium"
                                    >
                                        Iniciar Sesión
                                    </Link>
                                </p>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
