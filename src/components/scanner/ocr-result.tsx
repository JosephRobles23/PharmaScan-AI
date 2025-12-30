'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Check, RotateCcw, X, Edit2 } from 'lucide-react';
import { ExpirationStatus } from '@/lib/utils/expiration';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OCRResultDisplayProps {
    productCode: string | null;
    expirationDate: string | null;
    expirationStatus: ExpirationStatus | null;
    rawText?: string;
    onConfirm: (data: { productCode: string; expirationDate: string }) => void;
    onRetry: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export function OCRResultDisplay({
    productCode,
    expirationDate,
    expirationStatus,
    rawText,
    onConfirm,
    onRetry,
    onCancel,
    loading,
}: OCRResultDisplayProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedCode, setEditedCode] = useState(productCode || '');
    const [editedDate, setEditedDate] = useState(expirationDate || '');

    const handleConfirm = () => {
        onConfirm({
            productCode: editedCode || productCode || '',
            expirationDate: editedDate || expirationDate || '',
        });
    };

    const formatDisplayDate = (dateStr: string | null) => {
        if (!dateStr) return 'No detectada';
        try {
            const date = new Date(dateStr);
            return format(date, "dd 'de' MMMM, yyyy", { locale: es });
        } catch {
            return dateStr;
        }
    };

    const hasData = productCode || expirationDate;

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    Datos Detectados
                </h3>
                {hasData && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-[#64748B] hover:text-[#0066CC] transition-colors"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                )}
            </div>

            {!hasData ? (
                <div className="text-center py-4">
                    <p className="text-[#EF4444] mb-4">
                        No se pudo detectar información. Por favor, intente de nuevo.
                    </p>
                    {rawText && (
                        <details className="text-left text-sm text-[#64748B]">
                            <summary className="cursor-pointer">Ver texto detectado</summary>
                            <pre className="mt-2 p-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-lg overflow-auto">
                                {rawText}
                            </pre>
                        </details>
                    )}
                </div>
            ) : isEditing ? (
                <div className="space-y-4">
                    <Input
                        label="Código del Producto"
                        value={editedCode}
                        onChange={(e) => setEditedCode(e.target.value)}
                        placeholder="Ingrese el código"
                    />
                    <Input
                        label="Fecha de Vencimiento"
                        type="date"
                        value={editedDate}
                        onChange={(e) => setEditedDate(e.target.value)}
                    />
                    <Button
                        variant="secondary"
                        onClick={() => setIsEditing(false)}
                        className="w-full"
                    >
                        Cancelar edición
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl">
                        <span className="text-[#64748B] text-sm">Código</span>
                        <span className="font-mono font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                            {productCode || 'No detectado'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl">
                        <span className="text-[#64748B] text-sm">Vencimiento</span>
                        <span className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                            {formatDisplayDate(expirationDate)}
                        </span>
                    </div>
                    {expirationStatus && (
                        <div className="flex justify-between items-center p-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl">
                            <span className="text-[#64748B] text-sm">Estado</span>
                            <StatusBadge status={expirationStatus} />
                        </div>
                    )}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 order-3 sm:order-1"
                >
                    <X className="w-5 h-5 mr-2" />
                    Cancelar
                </Button>
                <Button
                    variant="secondary"
                    onClick={onRetry}
                    disabled={loading}
                    className="flex-1 order-2"
                >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reintentar
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={loading || (!hasData && !editedCode && !editedDate)}
                    loading={loading}
                    className="flex-1 order-1 sm:order-3"
                >
                    <Check className="w-5 h-5 mr-2" />
                    Confirmar
                </Button>
            </div>
        </div>
    );
}
