export class LoginController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.biometricAccessHandled = false;
    }

    initialize() {
        this.view.updateCameraToggle(false);
        this.view.updateKeypadDisplay("");
        this.view.updateKeypadResult(null, "Ingresa el PIN temporal");
        this.view.bind(this);
        this.startBiometricStatusPolling();
    }

    startBiometricStatusPolling() {
        window.setInterval(async () => {
            if (this.biometricAccessHandled) {
                return;
            }

            try {
                const { response, result } = await this.model.getBiometricAccessStatus();

                if (!response.ok || !result.active) {
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
                this.view.updateKeypadResult("success", methodLabel);
                await this.view.playUnlockAnimation();
                this.view.redirectToDashboard();
            } catch (_error) {
                // Silent polling; the page should keep working even if the backend check fails temporarily.
            }
        }, 3000);
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
        const code = this.model.getKeypadBuffer();

        if (code.length !== 6) {
            this.view.updateKeypadResult("error", "PIN incompleto");
            this.view.setFeedback("warning", "PIN incompleto", "Ingresa los 6 dígitos del código generado en la app antes de validar.");
            return;
        }

        this.view.updateKeypadResult("pending", "Validando...");
        this.view.setFeedback("info", "Validando PIN", "Comprobando el código temporal contra el backend compartido.");

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
            this.view.setFeedback("error", "Acceso rechazado", error.message || "El código ingresado no es válido.");
        }
    }

    handlePasswordLogin(event) {
        event.preventDefault();
        this.view.setFeedback("info", "Acceso por contraseña habilitado", "Entrando al dashboard sin validación de credenciales en esta versión de prueba.");
        this.view.redirectWithPasswordLogin();
    }
}
