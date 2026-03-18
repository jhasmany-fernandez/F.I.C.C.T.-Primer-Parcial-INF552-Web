"use client";

import Signin from "@/components/Auth/Signin";
import FaceScanner, { FaceScannerRef } from "@/components/Auth/FaceScanner";
import Image from "next/image";
import Link from "next/link";
import { useRef, createContext } from "react";

// Create context to share FaceScanner ref with child components
export const FaceScannerContext = createContext<React.RefObject<FaceScannerRef> | null>(null);

export default function SignIn() {
  const faceScannerRef = useRef<FaceScannerRef>(null);

  return (
    <FaceScannerContext.Provider value={faceScannerRef}>
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-wrap items-stretch">
          {/* Left Side - Face Scanner */}
          <div className="w-full xl:w-1/2 border-r border-stroke dark:border-dark-3">
            <div className="custom-gradient-1 h-full rounded-l-[10px] p-8 sm:p-12.5 dark:!bg-dark-2 dark:bg-none">
              <Link className="mb-8 inline-block" href="/">
                <Image
                  className="hidden dark:block"
                  src={"/images/logo/logo.svg"}
                  alt="Logo"
                  width={176}
                  height={32}
                />
                <Image
                  className="dark:hidden"
                  src={"/images/logo/logo-dark.svg"}
                  alt="Logo"
                  width={176}
                  height={32}
                />
              </Link>

              <div className="mb-6">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-primary">
                    Reconocimiento Facial
                  </span>
                </div>

                <h1 className="mb-3 text-3xl font-bold text-dark dark:text-white sm:text-4xl">
                  ¡Bienvenido!
                </h1>

                <p className="mb-8 text-base font-medium text-dark-4 dark:text-dark-6">
                  Inicia sesión de forma segura con reconocimiento facial.
                  Simplemente mira a la cámara y listo.
                </p>
              </div>

              <div className="mb-6">
                <FaceScanner ref={faceScannerRef} isScanning={true} />
              </div>

              <div className="rounded-xl bg-white/50 p-4 backdrop-blur-sm dark:bg-dark/30">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 text-sm font-semibold text-dark dark:text-white">
                      100% Seguro y Privado
                    </h4>
                    <p className="text-xs text-dark-4 dark:text-dark-6">
                      Tu información facial se procesa de forma local y encriptada.
                      Nunca se comparte con terceros.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Password Login */}
          <div className="w-full xl:w-1/2">
            <div className="w-full p-8 sm:p-12.5">
              <div className="mb-8">
                <h2 className="mb-2 text-2xl font-bold text-dark dark:text-white">
                  Iniciar Sesión
                </h2>
                <p className="text-sm text-dark-4 dark:text-dark-6">
                  Accede a tu cuenta con reconocimiento facial o contraseña
                </p>
              </div>

              <Signin />
            </div>
          </div>
        </div>
      </div>
    </FaceScannerContext.Provider>
  );
}
