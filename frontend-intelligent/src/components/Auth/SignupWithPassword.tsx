"use client";
import { EmailIcon, PasswordIcon, UserIcon } from "@/assets/icons";
import React, { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import InputGroup from "../FormElements/InputGroup";
import { Checkbox } from "../FormElements/checkbox";
import { authService } from "@/services/authService";
import { FaceScannerContext } from "@/app/auth/sign-up/page";
import toast from "react-hot-toast";

export default function SignupWithPassword() {
  const router = useRouter();
  const faceScannerRef = useContext(FaceScannerContext);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: "",
    general: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: "",
      general: "",
    };
    let isValid = true;

    // Validate first name
    if (!data.firstName.trim()) {
      newErrors.firstName = "Nombre es requerido";
      isValid = false;
    }

    // Validate last name
    if (!data.lastName.trim()) {
      newErrors.lastName = "Apellido es requerido";
      isValid = false;
    }

    // Validate username
    if (!data.username.trim()) {
      newErrors.username = "Nombre de usuario es requerido";
      isValid = false;
    }

    // Validate email
    if (!data.email.trim()) {
      newErrors.email = "Email es requerido";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = "Email no es válido";
      isValid = false;
    }

    // Validate password
    if (!data.password) {
      newErrors.password = "Contraseña es requerida";
      isValid = false;
    } else if (data.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
      isValid = false;
    }

    // Validate confirm password
    if (!data.confirmPassword) {
      newErrors.confirmPassword = "Por favor confirma tu contraseña";
      isValid = false;
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
      isValid = false;
    }

    // Validate terms
    if (!data.terms) {
      newErrors.terms = "Debes aceptar los términos y condiciones";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Capture photo from FaceScanner
    if (!faceScannerRef || !faceScannerRef.current) {
      setErrors({
        ...errors,
        general: "Error: La cámara no está disponible. Por favor, recarga la página.",
      });
      return;
    }

    const faceImage = faceScannerRef.current.capturePhoto();

    if (!faceImage) {
      setErrors({
        ...errors,
        general: "Error al capturar la foto. Por favor, asegúrate de que la cámara esté encendida.",
      });
      return;
    }

    setLoading(true);
    setErrors({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: "",
      general: "",
    });

    try {
      // Register user with facial recognition
      const response = await authService.register({
        email: data.email,
        username: data.username,
        password: data.password,
        password_confirm: data.confirmPassword,
        first_name: data.firstName,
        last_name: data.lastName,
        face_image_base64: faceImage,
      });

      // Check if there was a warning about face recognition
      if (response.warning) {
        toast.success('Cuenta creada exitosamente', {
          icon: '⚠️',
        });
        toast('Reconocimiento facial no disponible temporalmente', {
          icon: 'ℹ️',
          duration: 5000,
        });
      } else {
        toast.success('¡Registro exitoso! Bienvenido');
      }

      // Redirect to dashboard or home
      setTimeout(() => router.push("/"), 1000);
    } catch (error: any) {

      // Handle specific error messages
      const newErrors: any = {
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: "",
        general: "",
      };

      // Check for field-specific errors
      if (error.email) {
        newErrors.email = Array.isArray(error.email) ? error.email[0] : error.email;
      }
      if (error.username) {
        newErrors.username = Array.isArray(error.username) ? error.username[0] : error.username;
      }
      if (error.first_name) {
        newErrors.firstName = Array.isArray(error.first_name) ? error.first_name[0] : error.first_name;
      }
      if (error.last_name) {
        newErrors.lastName = Array.isArray(error.last_name) ? error.last_name[0] : error.last_name;
      }
      if (error.password) {
        newErrors.password = Array.isArray(error.password) ? error.password[0] : error.password;
      }
      if (error.password_confirm) {
        newErrors.confirmPassword = Array.isArray(error.password_confirm) ? error.password_confirm[0] : error.password_confirm;
      }

      // Check for general errors
      if (error.message) {
        newErrors.general = error.message;
      } else if (error.detail) {
        newErrors.general = error.detail;
      } else if (error.non_field_errors) {
        newErrors.general = Array.isArray(error.non_field_errors)
          ? error.non_field_errors[0]
          : error.non_field_errors;
      }

      // If no specific errors, set a general error
      const hasErrors = Object.values(newErrors).some(err => err !== "");
      if (!hasErrors) {
        newErrors.general = "Error al registrar. Por favor, intenta nuevamente.";
      }

      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors.general && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-red/10 p-4 border-l-4 border-red">
          <svg className="h-5 w-5 shrink-0 text-red mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red">{errors.general}</span>
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <InputGroup
            type="text"
            label="Nombre"
            className="[&_input]:py-[15px] [&_input]:rounded-lg"
            placeholder="Juan"
            name="firstName"
            handleChange={handleChange}
            value={data.firstName}
            icon={<UserIcon />}
          />
          {errors.firstName && (
            <p className="mt-2 flex items-center gap-1 text-sm text-red">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.firstName}
            </p>
          )}
        </div>

        <div>
          <InputGroup
            type="text"
            label="Apellido"
            className="[&_input]:py-[15px] [&_input]:rounded-lg"
            placeholder="Pérez"
            name="lastName"
            handleChange={handleChange}
            value={data.lastName}
            icon={<UserIcon />}
          />
          {errors.lastName && (
            <p className="mt-2 flex items-center gap-1 text-sm text-red">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="mb-5">
        <InputGroup
          type="text"
          label="Nombre de usuario"
          className="[&_input]:py-[15px] [&_input]:rounded-lg"
          placeholder="juanperez123"
          name="username"
          handleChange={handleChange}
          value={data.username}
          icon={<UserIcon />}
        />
        {errors.username && (
          <p className="mt-2 flex items-center gap-1 text-sm text-red">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.username}
          </p>
        )}
      </div>

      <div className="mb-5">
        <InputGroup
          type="email"
          label="Correo electrónico"
          className="[&_input]:py-[15px] [&_input]:rounded-lg"
          placeholder="tu@email.com"
          name="email"
          handleChange={handleChange}
          value={data.email}
          icon={<EmailIcon />}
        />
        {errors.email && (
          <p className="mt-2 flex items-center gap-1 text-sm text-red">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.email}
          </p>
        )}
      </div>

      <div className="mb-5">
        <InputGroup
          type="password"
          label="Contraseña"
          className="[&_input]:py-[15px] [&_input]:rounded-lg"
          placeholder="Mínimo 8 caracteres"
          name="password"
          handleChange={handleChange}
          value={data.password}
          icon={<PasswordIcon />}
        />
        {errors.password && (
          <p className="mt-2 flex items-center gap-1 text-sm text-red">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.password}
          </p>
        )}
      </div>

      <div className="mb-5">
        <InputGroup
          type="password"
          label="Confirmar Contraseña"
          className="[&_input]:py-[15px] [&_input]:rounded-lg"
          placeholder="Repite tu contraseña"
          name="confirmPassword"
          handleChange={handleChange}
          value={data.confirmPassword}
          icon={<PasswordIcon />}
        />
        {errors.confirmPassword && (
          <p className="mt-2 flex items-center gap-1 text-sm text-red">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <div className="mb-6">
        <Checkbox
          label={
            <span className="text-sm">
              Acepto los{" "}
              <a href="#" className="text-primary hover:underline font-medium">
                términos y condiciones
              </a>
            </span>
          }
          name="terms"
          withIcon="check"
          minimal
          radius="md"
          onChange={(e) =>
            setData({
              ...data,
              terms: e.target.checked,
            })
          }
        />
        {errors.terms && (
          <p className="mt-2 flex items-center gap-1 text-sm text-red">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.terms}
          </p>
        )}
      </div>

      <div className="mb-4">
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/90 p-4 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

          {loading ? (
            <>
              <span className="relative z-10 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
              <span className="relative z-10">Creando tu cuenta...</span>
            </>
          ) : (
            <>
              <svg className="relative z-10 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="relative z-10">Crear Cuenta con Reconocimiento Facial</span>
            </>
          )}
        </button>

        <p className="mt-3 text-center text-xs text-dark-4 dark:text-dark-6">
          Activa la cámara en el panel izquierdo antes de crear tu cuenta
        </p>
      </div>
    </form>
  );
}
