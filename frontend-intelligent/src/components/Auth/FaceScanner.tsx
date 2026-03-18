"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

interface FaceScannerProps {
  onFaceDetected?: (imageData: Blob) => void;
  isScanning?: boolean;
}

export interface FaceScannerRef {
  capturePhoto: () => string | null;
}

const FaceScanner = forwardRef<FaceScannerRef, FaceScannerProps>(
  ({ onFaceDetected, isScanning = true }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string>("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Capture photo from video stream and convert to base64
   */
  const capturePhoto = (): string | null => {
    const video = videoRef.current;

    if (!video || !hasPermission || !cameraEnabled) {
      console.error("Camera not ready or not enabled");
      return null;
    }

    try {
      // Create a temporary canvas to capture the photo
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;

      const ctx = captureCanvas.getContext('2d');
      if (!ctx) {
        console.error("Failed to get canvas context");
        return null;
      }

      // Draw the current video frame (mirror it back to normal)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -captureCanvas.width, 0, captureCanvas.width, captureCanvas.height);
      ctx.restore();

      // Convert to base64 JPEG (quality 0.8)
      const base64Image = captureCanvas.toDataURL('image/jpeg', 0.8);

      return base64Image;
    } catch (error) {
      console.error("Error capturing photo:", error);
      return null;
    }
  };

  // Expose capturePhoto method to parent components
  useImperativeHandle(ref, () => ({
    capturePhoto,
  }));

  // Función para detener la cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setHasPermission(false);
    setFaceDetected(false);
    setError("");
  };

  // Iniciar/detener cámara cuando cambia el estado
  useEffect(() => {
    if (!cameraEnabled) {
      stopCamera();
      return;
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          setError("");
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("No se pudo acceder a la cámara. Por favor, concede los permisos.");
        setHasPermission(false);
      }
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [cameraEnabled]);

  // Dibujar puntos faciales
  const drawFacePoints = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isScanning) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajustar tamaño del canvas al video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simular puntos faciales (en producción usarías la API de detección)
    if (video.videoWidth > 0) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const faceWidth = canvas.width * 0.4;
      const faceHeight = canvas.height * 0.5;

      // Dibujar óvalo facial
      ctx.strokeStyle = "#5750F1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        faceWidth / 2,
        faceHeight / 2,
        0,
        0,
        2 * Math.PI
      );
      ctx.stroke();

      // Puntos faciales principales
      const points = [
        // Ojos
        { x: centerX - faceWidth * 0.25, y: centerY - faceHeight * 0.15 },
        { x: centerX + faceWidth * 0.25, y: centerY - faceHeight * 0.15 },
        // Nariz
        { x: centerX, y: centerY },
        // Boca
        { x: centerX - faceWidth * 0.15, y: centerY + faceHeight * 0.25 },
        { x: centerX + faceWidth * 0.15, y: centerY + faceHeight * 0.25 },
        // Contorno
        { x: centerX - faceWidth * 0.4, y: centerY - faceHeight * 0.3 },
        { x: centerX + faceWidth * 0.4, y: centerY - faceHeight * 0.3 },
        { x: centerX - faceWidth * 0.45, y: centerY },
        { x: centerX + faceWidth * 0.45, y: centerY },
        { x: centerX - faceWidth * 0.35, y: centerY + faceHeight * 0.4 },
        { x: centerX + faceWidth * 0.35, y: centerY + faceHeight * 0.4 },
      ];

      // Dibujar puntos
      points.forEach((point, index) => {
        ctx.fillStyle = "#5750F1";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Animación de pulso
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3 + index * 0.3) * 2 + 2;
        ctx.strokeStyle = "rgba(87, 80, 241, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 + pulse, 0, 2 * Math.PI);
        ctx.stroke();
      });

      // Líneas conectoras
      ctx.strokeStyle = "rgba(87, 80, 241, 0.5)";
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }

      setFaceDetected(true);
    }

    // Continuar animación
    animationRef.current = requestAnimationFrame(drawFacePoints);
  };

  // Iniciar detección cuando el video esté listo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      video.play();
      drawFacePoints();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [isScanning]);

  return (
    <div className="relative w-full">
      {/* Toggle control para habilitar/deshabilitar cámara */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-white/50 p-4 backdrop-blur-sm dark:bg-dark/30 border border-stroke dark:border-dark-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${cameraEnabled ? 'bg-primary/10' : 'bg-dark-6/10'}`}>
            <svg className={`h-5 w-5 transition-colors ${cameraEnabled ? 'text-primary' : 'text-dark-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-dark dark:text-white">
              Cámara de Reconocimiento
            </p>
            <p className="text-xs text-dark-4 dark:text-dark-6">
              {cameraEnabled ? 'Activa y funcionando' : 'Desactivada por privacidad'}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={() => setCameraEnabled(!cameraEnabled)}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            cameraEnabled ? 'bg-primary' : 'bg-stroke dark:bg-dark-3'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
              cameraEnabled ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {error && cameraEnabled && (
        <div className="rounded-2xl bg-red/10 p-6 text-center border-2 border-red/20">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red/20">
              <svg className="h-6 w-6 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-red">
            {error}
          </p>
          <p className="mt-2 text-xs text-red/70">
            Por favor, permite el acceso a la cámara en la configuración del navegador
          </p>
        </div>
      )}

      {/* Placeholder cuando la cámara está desactivada */}
      {!cameraEnabled && !error && (
        <div className="relative overflow-hidden rounded-2xl bg-stroke/50 dark:bg-dark-3 shadow-xl ring-2 ring-stroke dark:ring-dark-3">
          <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-dark-6/10 dark:bg-dark-6/20">
              <svg className="h-12 w-12 text-dark-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </div>

            <h3 className="mb-2 text-lg font-bold text-dark dark:text-white text-center">
              Cámara Desactivada
            </h3>

            <p className="mb-6 text-center text-sm text-dark-4 dark:text-dark-6 max-w-md">
              Por tu privacidad, la cámara está desactivada. Activa el interruptor arriba cuando estés listo para usar el reconocimiento facial.
            </p>

            <button
              type="button"
              onClick={() => setCameraEnabled(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Activar Cámara
            </button>
          </div>
        </div>
      )}

      {/* Vista de la cámara cuando está activada */}
      {cameraEnabled && !error && (
        <div className="relative overflow-hidden rounded-2xl bg-dark-2 shadow-xl ring-2 ring-primary/20">
          {/* Video de la cámara */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full mirror"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Canvas para puntos faciales */}
          <canvas
            ref={canvasRef}
            className="absolute left-0 top-0 h-full w-full mirror"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Scan line effect */}
          {hasPermission && isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"></div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"></div>
            </div>
          )}

          {/* Indicador de escaneo mejorado */}
          {hasPermission && isScanning && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform">
              <div className="flex items-center gap-3 rounded-full bg-dark/90 px-5 py-2.5 backdrop-blur-md border border-white/10 shadow-lg">
                <div className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {faceDetected ? "✓ Rostro detectado" : "Escaneando rostro..."}
                </span>
              </div>
            </div>
          )}

          {/* Overlay de esquinas mejorado */}
          <div className="pointer-events-none absolute inset-0">
            {/* Esquina superior izquierda */}
            <div className="absolute left-3 top-3 h-12 w-12 border-l-3 border-t-3 border-primary rounded-tl-lg animate-pulse"></div>
            {/* Esquina superior derecha */}
            <div className="absolute right-3 top-3 h-12 w-12 border-r-3 border-t-3 border-primary rounded-tr-lg animate-pulse"></div>
            {/* Esquina inferior izquierda */}
            <div className="absolute bottom-3 left-3 h-12 w-12 border-b-3 border-l-3 border-primary rounded-bl-lg animate-pulse"></div>
            {/* Esquina inferior derecha */}
            <div className="absolute bottom-3 right-3 h-12 w-12 border-b-3 border-r-3 border-primary rounded-br-lg animate-pulse"></div>
          </div>

          {/* Status badge */}
          {hasPermission && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-2 rounded-full bg-green/90 px-3 py-1 backdrop-blur-sm">
                <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                <span className="text-xs font-semibold text-white">EN VIVO</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

FaceScanner.displayName = 'FaceScanner';

export default FaceScanner;
