# FaceScanner Component

Componente de React para captura y escaneo de rostro en tiempo real usando la cámara web.

## Características

- ✅ Acceso a cámara web del usuario
- ✅ Video en espejo (como un selfie)
- ✅ Detección y visualización de puntos faciales
- ✅ Animación de escaneo en tiempo real
- ✅ Indicador de rostro detectado
- ✅ Overlay con esquinas de escaneo
- ✅ Manejo de permisos de cámara

## Uso

```tsx
import FaceScanner from "@/components/Auth/FaceScanner";

// Básico
<FaceScanner />

// Con callback cuando se detecta un rostro
<FaceScanner
  onFaceDetected={(imageData) => {
    console.log("Rostro capturado", imageData);
  }}
  isScanning={true}
/>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onFaceDetected` | `(imageData: Blob) => void` | - | Callback cuando se detecta un rostro |
| `isScanning` | `boolean` | `true` | Activar/desactivar el escaneo |

## Permisos

El componente requiere permisos de cámara. El navegador mostrará automáticamente una solicitud de permiso al usuario.

## Integración

El componente está integrado en:
- `/auth/sign-up` - Página de registro

## Personalización

El componente usa las siguientes clases de Tailwind que puedes modificar:
- Color primario: `border-primary`, `bg-primary`, `text-primary`
- Colores de fondo: `bg-dark-2`, `bg-dark`
- Overlay: `backdrop-blur-sm`

## Notas

- El video se muestra en espejo (scaleX(-1)) para una mejor experiencia de usuario
- Los puntos faciales son simulados actualmente. Para detección real, integrar con la API de face-recognition
- El componente limpia automáticamente los recursos de la cámara al desmontarse
