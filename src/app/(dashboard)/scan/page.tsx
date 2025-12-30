'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CameraCapture } from '@/components/scanner/camera-capture';
import { OCRResultDisplay } from '@/components/scanner/ocr-result';
import { UnitCounter } from '@/components/scanner/unit-counter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingOverlay } from '@/components/ui/loading';
import { speak, voiceMessages } from '@/lib/utils/voice';
import { getExpirationStatus, ExpirationStatus } from '@/lib/utils/expiration';
import { generateProductNameId } from '@/lib/utils/cn';
import { OCRResult } from '@/types';
import {
    Package,
    ScanLine,
    CheckCircle2,
    XCircle,
    ArrowRight,
} from 'lucide-react';

type ScanStep = 'product' | 'scanning' | 'result' | 'confirm';

export default function ScanPage() {
    const router = useRouter();
    const supabase = createClient();

    // State
    const [step, setStep] = useState<ScanStep>('product');
    const [productName, setProductName] = useState('');
    const [unitsScanned, setUnitsScanned] = useState(0);
    const [loading, setLoading] = useState(false);
    const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
    const [expirationStatus, setExpirationStatus] = useState<ExpirationStatus | null>(null);
    const [alertMonths, setAlertMonths] = useState(3);
    const [userId, setUserId] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Load user settings
    useEffect(() => {
        const loadSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUserId(user.id);

            const { data: settings } = await supabase
                .from('user_settings')
                .select('expiration_alert_months')
                .eq('user_id', user.id)
                .single();

            if (settings) {
                setAlertMonths(settings.expiration_alert_months);
            }

            // Load existing units for this product if resuming
            // (This is a simplified version - you might want to track session state)
        };

        loadSettings();
    }, [supabase, router]);

    // Handle product name submission
    const handleProductSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (productName.trim()) {
            setStep('scanning');
        }
    };

    // Handle image capture and OCR
    const handleImageCapture = async (images: string[]) => {
        setLoading(true);
        setStep('result');

        speak(`Procesando ${images.length} imágenes...`);

        try {
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images }),
            });

            const result: OCRResult = await response.json();
            setOcrResult(result);

            // Calculate expiration status
            if (result.expirationDate) {
                const status = getExpirationStatus(result.expirationDate, alertMonths);
                setExpirationStatus(status);
            }
        } catch (error) {
            console.error('OCR Error:', error);
            setOcrResult({
                success: false,
                productCode: null,
                expirationDate: null,
                rawText: '',
                error: 'Error al procesar las imágenes',
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle unit confirmation
    const handleConfirmUnit = async (data: { productCode: string; expirationDate: string }) => {
        if (!userId) return;

        setLoading(true);

        try {
            const status = getExpirationStatus(data.expirationDate, alertMonths);

            // Insert product unit
            const { error } = await supabase.from('product_units').insert({
                user_id: userId,
                product_name: productName,
                product_code: data.productCode || null,
                expiration_date: data.expirationDate,
                expiration_status: status,
            });

            if (error) throw error;

            // Update count and show feedback
            const newCount = unitsScanned + 1;
            setUnitsScanned(newCount);

            // Voice feedback
            speak(voiceMessages.unitRegistered(newCount));

            if (status === 'expiring_soon') {
                setTimeout(() => speak(voiceMessages.productExpiringSoon), 1500);
            } else if (status === 'expired') {
                setTimeout(() => speak(voiceMessages.productExpired), 1500);
            }

            // Show success briefly then go back to scanning
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setOcrResult(null);
                setExpirationStatus(null);
                setStep('scanning');
            }, 1500);
        } catch (error) {
            console.error('Error saving unit:', error);
            speak(voiceMessages.scanError);
        } finally {
            setLoading(false);
        }
    };

    // Handle retry
    const handleRetry = () => {
        setOcrResult(null);
        setExpirationStatus(null);
        setStep('scanning');
    };

    // Handle cancel
    const handleCancel = () => {
        setOcrResult(null);
        setExpirationStatus(null);
        setStep('scanning');
    };

    // Handle finalize product
    const handleFinalizeProduct = async () => {
        if (!userId || unitsScanned === 0) return;

        setLoading(true);

        try {
            const productNameId = generateProductNameId(productName);

            // Upsert product summary
            const { error } = await supabase.from('products_summary').upsert(
                {
                    user_id: userId,
                    product_name: productName,
                    product_name_id: productNameId,
                    total_quantity: unitsScanned,
                    last_updated: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id,product_name_id',
                }
            );

            if (error) throw error;

            // Voice feedback
            speak(voiceMessages.productFinalized(productName, unitsScanned));

            // Reset state for new product
            setProductName('');
            setUnitsScanned(0);
            setOcrResult(null);
            setExpirationStatus(null);
            setStep('product');

            // Optional: redirect to inventory
            // router.push('/inventory');
        } catch (error) {
            console.error('Error finalizing product:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle new product
    const handleNewProduct = () => {
        setProductName('');
        setUnitsScanned(0);
        setOcrResult(null);
        setExpirationStatus(null);
        setStep('product');
    };

    return (
        <div className="max-w-lg mx-auto space-y-4">
            {loading && <LoadingOverlay text="Procesando..." />}

            {/* Success overlay */}
            {showSuccess && (
                <div className="fixed inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-2xl text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                            ¡Registrado!
                        </h3>
                        <p className="text-sm text-[#64748B] mt-1">
                            Total: {unitsScanned} {unitsScanned === 1 ? 'unidad' : 'unidades'}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Escanear
                </h1>
                <p className="text-sm text-[#64748B] mt-0.5">
                    {step === 'product'
                        ? 'Ingresa nombre'
                        : `Producto: ${productName}`}
                </p>
            </div>

            {/* Unit Counter (when scanning) */}
            {step !== 'product' && (
                <UnitCounter count={unitsScanned} productName={productName} />
            )}

            {/* Step: Product Name */}
            {step === 'product' && (
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleProductSubmit} className="space-y-3">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Package className="w-8 h-8 text-[#0066CC]" />
                            </div>

                            <Input
                                id="productName"
                                label="Nombre del Producto"
                                placeholder="Ej: Paracetamol 500mg"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                autoFocus
                                required
                            />

                            <Button type="submit" className="w-full">
                                Escanear
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Step: Camera Scanning */}
            {step === 'scanning' && (
                <Card>
                    <CardContent className="p-3">
                        <CameraCapture
                            onCapture={handleImageCapture}
                            onCancel={() => setStep('product')}
                            disabled={loading}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Step: OCR Result */}
            {step === 'result' && ocrResult && (
                <OCRResultDisplay
                    productCode={ocrResult.productCode}
                    expirationDate={ocrResult.expirationDate}
                    expirationStatus={expirationStatus}
                    rawText={ocrResult.rawText}
                    onConfirm={handleConfirmUnit}
                    onRetry={handleRetry}
                    onCancel={handleCancel}
                    loading={loading}
                />
            )}

            {/* Finalize Button (when units > 0) */}
            {step !== 'product' && unitsScanned > 0 && (
                <div className="space-y-2">
                    <Button
                        onClick={handleFinalizeProduct}
                        variant="secondary"
                        className="w-full text-sm"
                        disabled={loading}
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Finalizar ({unitsScanned})
                    </Button>

                    <Button
                        onClick={handleNewProduct}
                        variant="ghost"
                        className="w-full text-xs"
                        size="sm"
                        disabled={loading}
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar y Nuevo
                    </Button>
                </div>
            )}

            {/* Quick Tips */}
            {step === 'scanning' && (
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-3 text-xs text-[#0066CC]">
                    <p className="font-medium mb-1">💡 Tips:</p>
                    <ul className="space-y-0.5 text-[#64748B]">
                        <li>• Buena iluminación</li>
                        <li>• Enfoca fecha y lote</li>
                        <li>• Cámara estable</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
