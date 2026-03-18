import ForgotPassword from "@/components/Auth/ForgotPassword";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forgot Password - Recuperar Contraseña",
  description: "Recupera el acceso a tu cuenta de forma segura",
};

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="flex flex-wrap items-stretch">
        {/* Left Side - Information */}
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

            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="text-sm font-semibold text-primary">
                  Recuperación Segura
                </span>
              </div>

              <h1 className="mb-3 text-3xl font-bold text-dark dark:text-white sm:text-4xl">
                ¡No te Preocupes!
              </h1>

              <p className="mb-8 text-base font-medium text-dark-4 dark:text-dark-6">
                Recuperar el acceso a tu cuenta es fácil y seguro.
                Te enviaremos instrucciones paso a paso a tu email.
              </p>
            </div>

            <div className="mb-8">
              <div className="relative overflow-hidden rounded-2xl bg-white/50 p-8 backdrop-blur-sm dark:bg-dark/30">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10"></div>
                <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-primary/5"></div>

                <div className="relative">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>

                  <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">
                    Revisa tu Email
                  </h3>
                  <p className="text-sm text-dark-4 dark:text-dark-6">
                    Recibirás un enlace seguro para restablecer tu contraseña.
                    El enlace expirará en 24 horas por seguridad.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start gap-3 rounded-xl bg-white/50 p-4 backdrop-blur-sm dark:bg-dark/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-dark dark:text-white">
                    Proceso Seguro
                  </h4>
                  <p className="text-xs text-dark-4 dark:text-dark-6">
                    Todas las comunicaciones están encriptadas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-white/50 p-4 backdrop-blur-sm dark:bg-dark/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-dark dark:text-white">
                    Respuesta Rápida
                  </h4>
                  <p className="text-xs text-dark-4 dark:text-dark-6">
                    Recibirás el email en menos de 5 minutos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Reset Form */}
        <div className="w-full xl:w-1/2">
          <div className="w-full p-8 sm:p-12.5">
            <ForgotPassword />
          </div>
        </div>
      </div>
    </div>
  );
}
