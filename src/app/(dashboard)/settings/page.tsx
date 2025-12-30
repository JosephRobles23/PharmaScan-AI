'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { speak } from '@/lib/utils/voice';
import {
    Settings,
    Bell,
    Volume2,
    VolumeX,
    Save,
    CheckCircle,
    User,
    Mail,
} from 'lucide-react';

export default function SettingsPage() {
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Settings
    const [alertMonths, setAlertMonths] = useState(3);
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserEmail(user.email || null);
                    setUserId(user.id);

                    const { data: settings } = await supabase
                        .from('user_settings')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();

                    if (settings) {
                        setAlertMonths(settings.expiration_alert_months);
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [supabase]);

    const handleSave = async () => {
        if (!userId) return;

        setSaving(true);
        setSaved(false);

        try {
            const { error } = await supabase.from('user_settings').upsert(
                {
                    user_id: userId,
                    expiration_alert_months: alertMonths,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id',
                }
            );

            if (error) throw error;

            setSaved(true);

            if (voiceEnabled) {
                speak('Configuración guardada correctamente');
            }

            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const testVoice = () => {
        speak('Esta es una prueba de voz. PharmaScan AI está listo para usar.');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" text="Cargando configuración..." />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Configuración
                </h1>
                <p className="text-[#64748B] mt-1">
                    Personaliza tu experiencia en PharmaScan AI
                </p>
            </div>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <User className="w-5 h-5 text-[#0066CC]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                                Cuenta
                            </h2>
                            <p className="text-sm text-[#64748B]">Información de tu cuenta</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl">
                        <Mail className="w-5 h-5 text-[#64748B]" />
                        <div>
                            <p className="text-sm text-[#64748B]">Correo electrónico</p>
                            <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                {userEmail}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Expiration Alerts */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-[#F59E0B]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                                Alertas de Vencimiento
                            </h2>
                            <p className="text-sm text-[#64748B]">
                                Configura cuándo recibir alertas
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9] mb-2">
                            Alertar productos que vencen en los próximos:
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="12"
                                value={alertMonths}
                                onChange={(e) => setAlertMonths(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-[#E2E8F0] dark:bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#0066CC]"
                            />
                            <span className="w-20 text-center font-bold text-[#0066CC] text-lg">
                                {alertMonths} {alertMonths === 1 ? 'mes' : 'meses'}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-sm">
                        <p className="text-[#F59E0B]">
                            <strong>Ejemplo:</strong> Si configuras 3 meses, los productos que venzan
                            entre hoy y los próximos 3 meses aparecerán como "Por vencer".
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-[#10B981]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                                Feedback por Voz
                            </h2>
                            <p className="text-sm text-[#64748B]">
                                Configura las notificaciones por voz
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl">
                        <div className="flex items-center gap-3">
                            {voiceEnabled ? (
                                <Volume2 className="w-5 h-5 text-[#10B981]" />
                            ) : (
                                <VolumeX className="w-5 h-5 text-[#64748B]" />
                            )}
                            <div>
                                <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                    Habilitar voz
                                </p>
                                <p className="text-sm text-[#64748B]">
                                    Anuncia el conteo y alertas por voz
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`relative w-14 h-8 rounded-full transition-colors ${voiceEnabled ? 'bg-[#10B981]' : 'bg-[#E2E8F0] dark:bg-[#334155]'
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${voiceEnabled ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <Button variant="secondary" onClick={testVoice} className="w-full">
                        <Volume2 className="w-5 h-5 mr-2" />
                        Probar Voz
                    </Button>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center gap-4">
                <Button
                    onClick={handleSave}
                    loading={saving}
                    disabled={saving}
                    className="flex-1"
                    size="lg"
                >
                    {saved ? (
                        <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            ¡Guardado!
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Guardar Cambios
                        </>
                    )}
                </Button>
            </div>

            {saved && (
                <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-green-600 text-center animate-fade-in">
                    Configuración guardada correctamente
                </div>
            )}
        </div>
    );
}
