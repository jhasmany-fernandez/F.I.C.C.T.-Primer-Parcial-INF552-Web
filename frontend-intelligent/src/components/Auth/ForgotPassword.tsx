"use client";
import { EmailIcon } from "@/assets/icons";
import Link from "next/link";
import React, { useState } from "react";
import InputGroup from "../FormElements/InputGroup";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      setError("");
    }
  };

  const validateEmail = () => {
    if (!email.trim()) {
      setError("El correo electrónico es requerido");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Por favor ingresa un correo electrónico válido");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setLoading(true);
    setError("");

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      toast.success("Enlace de recuperación enviado!");
      console.log("Password reset email sent to:", email);
    }, 1500);
  };

  if (success) {
    return (
      <div className="text-center">
        {/* Success Icon with Animation */}
        <div className="mx-auto mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green/20 animate-ping"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green to-green/80 shadow-lg">
              <svg className="h-12 w-12 text-white animate-in zoom-in duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-bold text-dark dark:text-white">
          ¡Revisa tu Correo!
        </h2>

        {/* Email Display */}
        <div className="mb-6 rounded-xl bg-primary/5 p-4 dark:bg-primary/10">
          <p className="mb-2 text-sm text-dark-4 dark:text-dark-6">
            Hemos enviado instrucciones de recuperación a:
          </p>
          <p className="text-lg font-bold text-dark dark:text-white break-all">
            {email}
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-8 rounded-xl bg-stroke/50 p-5 dark:bg-dark-3/50">
          <div className="mb-4 flex items-start gap-3 text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <p className="text-sm text-dark-4 dark:text-dark-6">
              Abre tu correo y busca el mensaje de recuperación
            </p>
          </div>
          <div className="mb-4 flex items-start gap-3 text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <p className="text-sm text-dark-4 dark:text-dark-6">
              Haz clic en el enlace de recuperación
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <p className="text-sm text-dark-4 dark:text-dark-6">
              Crea una nueva contraseña segura
            </p>
          </div>
        </div>

        {/* Help Text */}
        <p className="mb-6 text-sm text-dark-4 dark:text-dark-6">
          ¿No recibiste el correo? Revisa tu carpeta de spam o{" "}
          <button
            onClick={() => {
              setSuccess(false);
              setEmail("");
            }}
            className="font-medium text-primary hover:underline"
          >
            intenta nuevamente
          </button>
        </p>

        {/* Back Button */}
        <Link
          href="/auth/sign-in"
          className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-stroke bg-white px-6 py-3.5 font-semibold text-dark transition-all duration-300 hover:border-primary hover:bg-primary/5 dark:border-dark-3 dark:bg-gray-dark dark:text-white dark:hover:border-primary dark:hover:bg-primary/10"
        >
          <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          Recuperar Contraseña
        </h2>
        <p className="text-sm text-dark-4 dark:text-dark-6">
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-red/10 p-4 border-l-4 border-red">
            <svg className="h-5 w-5 shrink-0 text-red mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red">{error}</span>
          </div>
        )}

        <div className="mb-6">
          <InputGroup
            type="email"
            label="Correo Electrónico"
            className="[&_input]:py-[15px] [&_input]:rounded-lg"
            placeholder="tu@email.com"
            name="email"
            handleChange={handleChange}
            value={email}
            icon={<EmailIcon />}
          />
        </div>

        <div className="mb-6">
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/90 p-4 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

            {loading ? (
              <>
                <span className="relative z-10 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
                <span className="relative z-10">Enviando...</span>
              </>
            ) : (
              <>
                <svg className="relative z-10 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="relative z-10">Enviar Enlace de Recuperación</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-dark-4 dark:text-dark-6">
            ¿Recordaste tu contraseña?{" "}
            <Link href="/auth/sign-in" className="text-primary hover:underline font-semibold">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </form>
    </>
  );
}
