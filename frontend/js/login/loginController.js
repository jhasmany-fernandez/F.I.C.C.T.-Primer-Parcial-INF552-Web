export class LoginController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.biometricAccessHandled = false;
        this.isValidatingPin = false;
        this.pinValidationWatchdog = null;
    }

    initialize() {
        this.view.updateCameraToggle(false);
        this.view.updateKeypadDisplay("");
        this.view.updateKeypadResult("pending", "Esperando huella o PIN");
        this.view.updateBiometricIndicator?.(
            "is-waiting",
            "Estado biométrico: esperando",
            "Aún no llega autorización desde la app."
        );
        this.view.setFeedback("info", "Sistema listo", "Esperando autorización por huella/facial o ingreso de PIN.");
        this.view.bind(this);
        this.startBiometricStatusPolling();
    }

    startBiometricStatusPolling() {
        const checkBiometricStatus = async () => {
            if (this.biometricAccessHandled) {
                return;
            }

            try {
                const { response, result } = await this.model.getBiometricAccessStatus();

                if (!response.ok || !result.active) {
                    this.view.updateBiometricIndicator?.(
                        "is-waiting",
                        "Estado biométrico: esperando",
                        "Sin autorización activa. Puedes usar huella en la app o ingresar PIN."
                    );
                    this.view.updateKeypadResult("pending", "Esperando huella o PIN");
                    return;
                }

                this.biometricAccessHandled = true;
                const methodLabel = result.method === "face"
                    ? "Acceso por reconocimiento facial"
                    : "Acceso por huella dactilar";
                this.view.setFeedback(
                    null,
                    "Acceso concedido",
                    result.method === "face"
                        ? "La chapa inteligente recibió autorización por reconocimiento facial desde la app móvil."
                        : "La chapa inteligente recibió autorización por huella dactilar desde la app móvil."
                );
                this.view.updateBiometricIndicator?.(
                    "is-active",
                    result.method === "face" ? "Estado biométrico: rostro activo" : "Estado biométrico: huella activa",
                    "Autorización biométrica recibida. Abriendo acceso..."
                );
                this.view.updateKeypadResult(
                    "success",
                    result.method === "face" ? "Rostro activo - acceso" : "Huella activa - acceso"
                );
                await this.view.playUnlockAnimation();
                this.view.redirectToDashboard();
            } catch (error) {
                this.view.updateKeypadResult("error", "Sin conexión");
                this.view.updateBiometricIndicator?.(
                    "is-error",
                    "Estado biométrico: error",
                    "No se pudo consultar el estado en backend."
                );
                this.view.setFeedback(
                    "warning",
                    "No se pudo consultar estado biométrico",
                    error?.message || "La página no logró consultar /api/biometric-access/status."
                );
            }
        };

        // Verificación inmediata para evitar esperar 3s tras abrir la página.
        checkBiometricStatus();
        window.setInterval(checkBiometricStatus, 3000);
    }

    async startCamera() {
        if (this.model.getStream()) {
            return true;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.view.setFeedback("error", "Cámara no disponible", "Tu navegador no soporta acceso a cámara.");
            return false;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 960 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            this.model.setStream(stream);
            this.view.attachStream(stream);
            this.view.setFeedback("info", "Cámara activa", "Ahora puedes autenticarte con reconocimiento facial.");
            return true;
        } catch (error) {
            this.view.updateCameraToggle(false);
            this.view.setFeedback("error", "Permiso denegado", "No se pudo acceder a la cámara. Revisa los permisos del navegador.");
            return false;
        }
    }

    stopCamera() {
        const stream = this.model.getStream();
        if (!stream) {
            this.view.updateCameraToggle(false);
            return;
        }

        stream.getTracks().forEach((track) => track.stop());
        this.model.clearStream();
        this.view.detachStream();
        this.view.setFeedback("info", "Cámara desactivada", "La vista previa se apagó. Puedes activarla nuevamente cuando quieras.");
    }

    async toggleCamera() {
        if (this.model.getStream()) {
            this.stopCamera();
            return;
        }

        await this.startCamera();
    }

    async loginWithFace() {
        const cameraReady = await this.startCamera();
        if (!cameraReady) {
            return;
        }

        const image = this.view.captureFrame();
        if (!image) {
            this.view.setFeedback("warning", "Captura pendiente", "Espera un momento a que la cámara cargue antes de capturar.");
            return;
        }

        this.view.setFeedback("info", "Procesando rostro", "Enviando imagen al backend Node.js para validación.");

        try {
            const { response, result } = await this.model.sendFaceLogin({
                identifier: this.model.getIdentifier(),
                image,
                threshold: 0.6
            });

            if (!response.ok) {
                throw new Error(result.message || result.error || "No se pudo validar el rostro.");
            }

            const similarityText = typeof result.similarity === "number"
                ? ` Coincidencia: ${(result.similarity * 100).toFixed(1)}%.`
                : "";

            this.view.setFeedback(
                null,
                "Acceso concedido",
                `${result.message || "Reconocimiento facial exitoso."}${similarityText}`
            );
            this.view.updateKeypadResult("success", "Rostro validado");
            await this.view.playUnlockAnimation();
            this.view.redirectToDashboard();
        } catch (error) {
            this.view.setFeedback("error", "Acceso denegado", error.message || "No fue posible autenticar el rostro.");
        }
    }

    async captureOnlyFlow() {
        const cameraReady = await this.startCamera();
        if (!cameraReady) {
            return;
        }

        const image = this.view.captureFrame();
        if (!image) {
            this.view.setFeedback("warning", "Sin captura", "Activa la cámara y espera a que aparezca la vista previa.");
            return;
        }

        this.view.setFeedback("info", "Captura lista", "Se obtuvo una imagen de prueba del rostro. Ya puedes probar /login-face.");
    }

    async handleKeypadInput(key) {
        if (key === "clear") {
            this.model.clearKeypadBuffer();
            this.view.updateKeypadDisplay("");
            this.view.updateKeypadResult(null, "PIN borrado");
            this.view.setFeedback("info", "PIN reiniciado", "Puedes volver a ingresar el código temporal generado desde la app.");
            return;
        }

        if (key === "submit") {
            await this.submitKeypadCode();
            return;
        }

        if (!/^\d$/.test(key)) {
            return;
        }

        const updated = this.model.appendKeypadDigit(key);
        this.view.updateKeypadDisplay(updated);

        if (updated.length === 6) {
            await this.submitKeypadCode();
        } else {
            this.view.updateKeypadResult("pending", `PIN ${updated.length}/6`);
        }
    }

    async submitKeypadCode() {
        if (this.isValidatingPin) {
            return;
        }

        const code = this.model.getKeypadBuffer();

        if (code.length !== 6) {
            this.view.updateKeypadResult("error", "PIN incompleto");
            this.view.setFeedback("warning", "PIN incompleto", "Ingresa los 6 dígitos del código generado en la app antes de validar.");
            return;
        }

        this.isValidatingPin = true;
        this.view.updateKeypadResult("pending", "Validando...");
        this.view.setFeedback("info", "Validando PIN", "Comprobando el código temporal contra el backend compartido.");

        this.pinValidationWatchdog = window.setTimeout(() => {
            this.isValidatingPin = false;
            this.view.updateKeypadResult("error", "Tiempo agotado");
            this.view.setFeedback(
                "error",
                "Sin respuesta del servidor",
                "La validación tardó demasiado. Recarga la página y vuelve a intentar."
            );
        }, 15000);

        try {
            const { response, result } = await this.model.validateAccessCode(code);

            if (!response.ok) {
                throw new Error(result.error || result.message || "No se pudo validar el PIN.");
            }

            this.view.updateKeypadResult("success", "PIN correcto");
            this.view.setFeedback(null, "Acceso permitido", result.message || "Código temporal válido.");
            this.model.clearKeypadBuffer();
            this.view.updateKeypadDisplay("");
            await this.view.playUnlockAnimation();
            this.view.redirectToDashboard();
        } catch (error) {
            this.view.updateKeypadResult("error", "PIN incorrecto");
            const message = error?.name === "AbortError"
                ? "La validación tardó demasiado. Verifica conexión a internet y backend."
                : (error.message || "El código ingresado no es válido.");
            this.view.setFeedback("error", "Acceso rechazado", message);
        } finally {
            this.isValidatingPin = false;
            if (this.pinValidationWatchdog) {
                window.clearTimeout(this.pinValidationWatchdog);
                this.pinValidationWatchdog = null;
            }
        }
    }

    handlePasswordLogin(event) {
        event.preventDefault();
        this.view.setFeedback("info", "Acceso por contraseña habilitado", "Entrando al dashboard sin validación de credenciales en esta versión de prueba.");
        this.view.redirectWithPasswordLogin();
    }
}
