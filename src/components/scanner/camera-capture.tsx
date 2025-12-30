'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, Image as ImageIcon, X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface CameraCaptureProps {
    onCapture: (imagesBase64: string[]) => void;
    onCancel?: () => void;
    disabled?: boolean;
}

export function CameraCapture({ onCapture, onCancel, disabled }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Multi-image state
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [cameraActive, setCameraActive] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });

            setStream(mediaStream);
            setCameraActive(true);
        } catch (err) {
            console.error('Camera error:', err);
            // Handle permission denied or other errors explicitly
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
            } else {
                setError('No se pudo acceder a la cámara. Verifica los permisos.');
            }
        }
    }, []);

    // Effect to attach stream to video element when it becomes available
    useEffect(() => {
        if (cameraActive && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((e) => {
                console.error('Error playing video:', e);
                setError('Error al iniciar la previsualización de video.');
            });
        }
    }, [cameraActive, stream]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        setCameraActive(false);
    }, [stream]);

    const captureImage = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        // Limit to 3 images
        if (capturedImages.length >= 3) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            setCapturedImages(prev => [...prev, imageData]);

            // If we reached max images, stop camera automatically
            if (capturedImages.length + 1 >= 3) {
                stopCamera();
            }
        }
    }, [stopCamera, capturedImages.length]);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        e.target.value = '';
    }, []);

    const removeImage = (index: number) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const confirmCapture = useCallback(() => {
        if (capturedImages.length > 0) {
            onCapture(capturedImages);
            // Cleanup
            setCapturedImages([]);
            stopCamera();
        }
    }, [capturedImages, onCapture, stopCamera]);

    const cancelCapture = useCallback(() => {
        setCapturedImages([]);
        stopCamera();
        onCancel?.();
    }, [stopCamera, onCancel]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    return (
        <div className="w-full space-y-4">
            {/* Camera Area */}
            {cameraActive && (
                <div
                    className={cn(
                        'relative aspect-[4/3] bg-[#1E293B] rounded-2xl overflow-hidden',
                        'border-2 border-dashed border-[#334155]'
                    )}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />

                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-3/4 h-1/2 border-2 border-[#0066CC] rounded-lg opacity-50">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#0066CC] rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#0066CC] rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#0066CC] rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#0066CC] rounded-br-lg" />
                        </div>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Captured Images Thumbnails */}
            {capturedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {capturedImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[#E2E8F0] dark:border-[#334155]">
                            <img src={img} alt={`Captura ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 rounded-full">
                                {idx + 1}
                            </div>
                        </div>
                    ))}
                    {/* Add placeholder if less than 3 */}
                    {capturedImages.length < 3 && cameraActive && (
                        <div className="flex items-center justify-center bg-[#F1F5F9] dark:bg-[#1E293B] rounded-lg border border-dashed border-[#94A3B8]">
                            <span className="text-xs text-[#64748B]">Espacio {capturedImages.length + 1}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Controls */}
            {cameraActive ? (
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={cancelCapture}
                            disabled={disabled}
                            className="flex-shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </Button>

                        <Button
                            onClick={captureImage}
                            className="flex-1"
                            size="lg"
                            disabled={disabled || capturedImages.length >= 3}
                        >
                            <Camera className="w-6 h-6 mr-2" />
                            {capturedImages.length < 3 ? 'Capturar' : 'Máximo alcanzado'}
                        </Button>
                    </div>

                    {capturedImages.length > 0 && (
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={confirmCapture}
                        >
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Analizar {capturedImages.length} {capturedImages.length === 1 ? 'imagen' : 'imágenes'}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {capturedImages.length > 0 ? (
                        <>
                            <Button
                                onClick={startCamera}
                                className="w-full"
                                variant="outline"
                                disabled={capturedImages.length >= 3}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar más fotos
                            </Button>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={confirmCapture}
                            >
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Analizar {capturedImages.length} {capturedImages.length === 1 ? 'imagen' : 'imágenes'}
                            </Button>
                        </>
                    ) : (
                        <div className="flex gap-3">
                            <Button
                                onClick={startCamera}
                                className="flex-1"
                                size="lg"
                                disabled={disabled}
                            >
                                <Camera className="w-6 h-6 mr-2" />
                                Activar Cámara
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={disabled}
                            >
                                <ImageIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {!cameraActive && capturedImages.length === 0 && (
                <p className="text-sm text-center text-[#64748B]">
                    Puedes tomar hasta 3 fotos para mejorar la detección.
                </p>
            )}
        </div>
    );
}
