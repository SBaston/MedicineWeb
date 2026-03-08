// ═══════════════════════════════════════════════════════════════
// Frontend/src/components/CameraCapture.jsx - CORREGIDO
// Componente para capturar foto con la cámara del dispositivo
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, RotateCw, Upload } from 'lucide-react';

const CameraCapture = ({ onCapture, onClose, title = "Capturar documento" }) => {
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'user' o 'environment'
    const [error, setError] = useState('');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // ═══════════════════════════════════════════════════════════
    // Iniciar cámara - CORREGIDO
    // ═══════════════════════════════════════════════════════════
    const startCamera = async () => {
        try {
            setError('');
            setIsCameraActive(true); // ← Marcar como activa ANTES de obtener el stream

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            setStream(mediaStream);

            // ═══════════════════════════════════════════════════════════
            // IMPORTANTE: Esperar un tick para que el video ref esté listo
            // ═══════════════════════════════════════════════════════════
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    // Forzar reproducción
                    videoRef.current.play().catch(err => {
                        console.error('Error al reproducir video:', err);
                    });
                }
            }, 100);
        } catch (err) {
            console.error('Error accediendo a la cámara:', err);
            setError('No se pudo acceder a la cámara. Verifica los permisos o usa la opción de subir archivo.');
            setIsCameraActive(false);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // Detener cámara
    // ═══════════════════════════════════════════════════════════
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsCameraActive(false);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // ═══════════════════════════════════════════════════════════
    // Capturar foto
    // ═══════════════════════════════════════════════════════════
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Ajustar tamaño del canvas al video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Dibujar frame actual del video
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convertir a Base64
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
    };

    // ═══════════════════════════════════════════════════════════
    // Cambiar entre cámara frontal/trasera
    // ═══════════════════════════════════════════════════════════
    const switchCamera = async () => {
        stopCamera();
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);

        // Esperar un momento antes de reiniciar
        setTimeout(() => {
            startCamera();
        }, 300);
    };

    // ═══════════════════════════════════════════════════════════
    // Subir desde archivo
    // ═══════════════════════════════════════════════════════════
    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setCapturedImage(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // ═══════════════════════════════════════════════════════════
    // Confirmar imagen capturada
    // ═══════════════════════════════════════════════════════════
    const confirmImage = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    };

    // ═══════════════════════════════════════════════════════════
    // Reintentar captura
    // ═══════════════════════════════════════════════════════════
    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    // ═══════════════════════════════════════════════════════════
    // Limpiar al desmontar
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        return () => stopCamera();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden">
                {/* Cabecera */}
                <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6">

                    {/* Error */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Vista de cámara o imagen capturada */}
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>

                        {/* Video (cámara activa) - CORREGIDO */}
                        {isCameraActive && !capturedImage && (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                                />

                                {/* Guías visuales */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* Marco de guía */}
                                    <div className="absolute inset-8 border-2 border-white/50 border-dashed rounded-lg" />

                                    {/* Texto de ayuda */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                        Centra el documento dentro del marco
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Imagen capturada */}
                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Captura"
                                className="w-full h-full object-contain"
                            />
                        )}

                        {/* Placeholder (cámara no iniciada) */}
                        {!isCameraActive && !capturedImage && (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                    <Camera className="w-16 h-16 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">La cámara se activará al presionar "Iniciar cámara"</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Canvas oculto para captura */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Input file oculto */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-3 justify-center">

                        {/* Sin imagen capturada */}
                        {!capturedImage && (
                            <>
                                {!isCameraActive ? (
                                    <>
                                        <button
                                            onClick={startCamera}
                                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            <Camera className="w-5 h-5" />
                                            Iniciar cámara
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            <Upload className="w-5 h-5" />
                                            Subir archivo
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={capturePhoto}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg"
                                        >
                                            <Camera className="w-5 h-5" />
                                            Capturar
                                        </button>
                                        <button
                                            onClick={switchCamera}
                                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            <RotateCw className="w-5 h-5" />
                                            Cambiar cámara
                                        </button>
                                        <button
                                            onClick={stopCamera}
                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                            Cancelar
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {/* Con imagen capturada */}
                        {capturedImage && (
                            <>
                                <button
                                    onClick={confirmImage}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg"
                                >
                                    <Check className="w-5 h-5" />
                                    Confirmar
                                </button>
                                <button
                                    onClick={retakePhoto}
                                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    <RotateCw className="w-5 h-5" />
                                    Tomar otra
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    <Upload className="w-5 h-5" />
                                    Subir otra
                                </button>
                            </>
                        )}
                    </div>

                    {/* Consejos */}
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                        <p className="font-semibold mb-2">📸 Consejos para una buena captura:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Asegúrate de que haya buena iluminación</li>
                            <li>El documento debe estar completamente visible</li>
                            <li>Evita reflejos y sombras</li>
                            <li>Mantén el dispositivo estable al capturar</li>
                            <li>El texto debe ser legible y estar enfocado</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CameraCapture;