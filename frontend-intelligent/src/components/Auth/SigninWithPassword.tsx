"use client";
import { EmailIcon, PasswordIcon } from "@/assets/icons";
import Link from "next/link";
import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import InputGroup from "../FormElements/InputGroup";
import { Checkbox } from "../FormElements/checkbox";
import { authService } from "@/services/authService";
import { FaceScannerContext } from "@/app/auth/sign-in/page";
import toast from "react-hot-toast";

export default function SigninWithPassword() {
  const router = useRouter();
  const faceScannerRef = useContext(FaceScannerContext);

  const [data, setData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.loginWithPassword({
        email: data.email,
        password: data.password,
        remember: data.remember,
      });

      toast.success('¡Inicio de sesión exitoso!');

      // Redirect to dashboard or home
      setTimeout(() => router.push("/"), 1000);
    } catch (error: any) {
      const errorMsg = error.message || error.detail || "Error al iniciar sesión. Por favor, verifica tus credenciales.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async () => {
    // Capture photo from FaceScanner
    if (!faceScannerRef || !faceScannerRef.current) {
      setError("Error: La cámara no está disponible. Por favor, recarga la página.");
      return;
    }

    const faceImage = faceScannerRef.current.capturePhoto();

    if (!faceImage) {
      setError("Error al capturar la foto. Por favor, asegúrate de que la cámara esté encendida.");
      return;
    }

    setFaceLoading(true);
    setError("");

    try {
      const response = await authService.loginWithFace({
        face_image_base64: faceImage,
      });

      toast.success('¡Reconocimiento facial exitoso!', {
        icon: '👤',
      });

      // Store response and show confirmation dialog
      setPendingLoginData(response);
      setShowConfirmation(true);
    } catch (error: any) {
      const errorMsg = error.message || error.detail || "No se pudo reconocer tu rostro. Intenta con contraseña o regístrate primero.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFaceLoading(false);
    }
  };

  const confirmLogin = () => {
    setShowConfirmation(false);
    toast.success('¡Bienvenido de nuevo!');
    setTimeout(() => router.push("/"), 500);
  };

  const cancelLogin = () => {
    setShowConfirmation(false);
    setPendingLoginData(null);
    toast('Inicio de sesión cancelado', {
      icon: 'ℹ️',
    });
  };

  return (
    <>
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-red/10 p-4 border-l-4 border-red">
          <svg className="h-5 w-5 shrink-0 text-red mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red">{error}</span>
        </div>
      )}

      {/* Face Recognition Login Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleFaceLogin}
          disabled={faceLoading}
          className="group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/90 p-4 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

          <svg className="h-6 w-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>

          <span className="relative z-10">
            {faceLoading ? "Reconociendo rostro..." : "Iniciar con Reconocimiento Facial"}
          </span>

          {faceLoading && (
            <span className="relative z-10 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
          )}
        </button>

        <p className="mt-3 text-center text-xs text-dark-4 dark:text-dark-6">
          Activa la cámara en el panel izquierdo, luego haz clic aquí
        </p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="block h-px flex-1 bg-stroke dark:bg-dark-3"></span>
        <span className="text-xs font-medium text-dark-4 dark:text-dark-6">O CONTINÚA CON</span>
        <span className="block h-px flex-1 bg-stroke dark:bg-dark-3"></span>
      </div>

      <form onSubmit={handlePasswordLogin}>
      <InputGroup
        type="email"
        label="Correo electrónico"
        className="mb-5 [&_input]:py-[15px] [&_input]:rounded-lg"
        placeholder="tu@email.com"
        name="email"
        handleChange={handleChange}
        value={data.email}
        icon={<EmailIcon />}
      />

      <InputGroup
        type="password"
        label="Contraseña"
        className="mb-5 [&_input]:py-[15px] [&_input]:rounded-lg"
        placeholder="••••••••"
        name="password"
        handleChange={handleChange}
        value={data.password}
        icon={<PasswordIcon />}
      />

      <div className="mb-6 flex items-center justify-between gap-2">
        <Checkbox
          label="Mantener sesión"
          name="remember"
          withIcon="check"
          minimal
          radius="md"
          onChange={(e) =>
            setData({
              ...data,
              remember: e.target.checked,
            })
          }
        />

        <Link
          href="/auth/forgot-password"
          className="text-sm font-medium text-primary hover:underline dark:text-primary"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <div className="mb-4">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-stroke bg-white p-4 font-semibold text-dark transition-all duration-300 hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-gray-dark dark:text-white dark:hover:border-primary dark:hover:bg-primary/10"
        >
          {loading ? (
            <>
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Iniciar con Email</span>
            </>
          )}
        </button>
      </div>
    </form>

    {/* Confirmation Modal */}
    {showConfirmation && pendingLoginData && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md transform animate-in zoom-in-95 duration-200">
          <div className="rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-dark border border-stroke dark:border-dark-3">
            {/* Success Icon with Animation */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                  <svg className="h-10 w-10 text-white animate-in zoom-in duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="mb-3 text-center text-2xl font-bold text-dark dark:text-white">
              ¡Rostro Reconocido!
            </h3>

            {/* User Info */}
            {pendingLoginData.user && (
              <div className="mb-6 rounded-xl bg-primary/5 p-4 dark:bg-primary/10">
                <p className="mb-1 text-center text-sm text-dark-4 dark:text-dark-6">
                  Bienvenido de nuevo
                </p>
                <p className="text-center text-xl font-bold text-dark dark:text-white">
                  {pendingLoginData.user.first_name} {pendingLoginData.user.last_name}
                </p>
                {pendingLoginData.user.email && (
                  <p className="mt-1 text-center text-sm text-dark-4 dark:text-dark-6">
                    {pendingLoginData.user.email}
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <p className="mb-8 text-center text-sm text-dark-4 dark:text-dark-6">
              Se ha identificado tu rostro correctamente.
              ¿Deseas continuar e iniciar sesión?
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelLogin}
                className="flex-1 rounded-xl border-2 border-stroke bg-white px-6 py-3.5 font-semibold text-dark transition-all duration-300 hover:border-red hover:bg-red/5 hover:text-red dark:border-dark-3 dark:bg-gray-dark dark:text-white dark:hover:border-red dark:hover:bg-red/10"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogin}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-6 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
