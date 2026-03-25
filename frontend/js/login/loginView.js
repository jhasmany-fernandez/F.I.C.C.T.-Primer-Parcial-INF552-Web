export class LoginView {
    constructor() {
        this.cameraPreview = document.getElementById("cameraPreview");
        this.cameraOverlay = document.getElementById("cameraOverlay");
        this.captureCanvas = document.getElementById("captureCanvas");
        this.startCameraBtn = document.getElementById("startCameraBtn");
        this.faceLoginBtn = document.getElementById("faceLoginBtn");
        this.captureOnlyBtn = document.getElementById("captureOnlyBtn");
        this.passwordLoginForm = document.getElementById("passwordLoginForm");
        this.feedbackBox = document.getElementById("loginFeedback");
        this.feedbackTitle = document.getElementById("feedbackTitle");
        this.feedbackMessage = document.getElementById("feedbackMessage");
        this.cameraToggleLabel = document.getElementById("cameraToggleLabel");
        this.cameraToggleHint = document.getElementById("cameraToggleHint");
        this.cameraToggleState = document.getElementById("cameraToggleState");
        this.keypadDisplay = document.getElementById("keypadDisplay");
        this.keypadResult = document.getElementById("keypadResult");
        this.keypadButtons = Array.from(document.querySelectorAll(".lock-key"));
        this.keypadResetButton = document.getElementById("keypadResetButton");
    }

    bind(controller) {
        this.startCameraBtn?.addEventListener("click", () => controller.toggleCamera());
        this.faceLoginBtn?.addEventListener("click", () => controller.loginWithFace());
        this.captureOnlyBtn?.addEventListener("click", () => controller.captureOnlyFlow());
        this.passwordLoginForm?.addEventListener("submit", (event) => controller.handlePasswordLogin(event));
        this.keypadButtons.forEach((button) => {
            button.addEventListener("click", () => controller.handleKeypadInput(button.dataset.key || ""));
        });
        this.keypadResetButton?.addEventListener("click", () => controller.handleKeypadInput("clear"));
        window.addEventListener("beforeunload", () => controller.stopCamera());
    }

    setFeedback(type, title, message) {
        this.feedbackBox.classList.remove("is-hidden", "is-error", "is-warning", "is-info");
        if (type) {
            this.feedbackBox.classList.add(`is-${type}`);
        }
        this.feedbackTitle.textContent = title;
        this.feedbackMessage.textContent = message;
    }

    updateCameraToggle(isActive) {
        this.startCameraBtn?.classList.toggle("is-active", isActive);
        this.startCameraBtn?.setAttribute("aria-pressed", String(isActive));

        if (this.cameraToggleLabel) {
            this.cameraToggleLabel.textContent = isActive ? "Cámara activada" : "Cámara desactivada";
        }

        if (this.cameraToggleHint) {
            this.cameraToggleHint.textContent = isActive
                ? "Apaga la cámara cuando termines la validación."
                : "Enciende la vista previa para validar el rostro.";
        }

        if (this.cameraToggleState) {
            this.cameraToggleState.textContent = isActive ? "ON" : "OFF";
        }
    }

    attachStream(stream) {
        this.cameraPreview.srcObject = stream;
        this.cameraOverlay.classList.add("is-active");
        this.updateCameraToggle(true);
    }

    detachStream() {
        this.cameraPreview.srcObject = null;
        this.cameraOverlay.classList.remove("is-active");
        this.updateCameraToggle(false);
    }

    captureFrame() {
        if (!this.cameraPreview.videoWidth || !this.cameraPreview.videoHeight) {
            return null;
        }

        this.captureCanvas.width = this.cameraPreview.videoWidth;
        this.captureCanvas.height = this.cameraPreview.videoHeight;

        const context = this.captureCanvas.getContext("2d");
        context.drawImage(this.cameraPreview, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
        return this.captureCanvas.toDataURL("image/jpeg", 0.92);
    }

    updateKeypadDisplay(value) {
        if (!this.keypadDisplay) {
            return;
        }

        if (!value) {
            this.keypadDisplay.textContent = "_ _ _ _ _ _";
            return;
        }

        const padded = value.padEnd(6, "_").split("").join(" ");
        this.keypadDisplay.textContent = padded;
    }

    updateKeypadResult(state, message) {
        if (!this.keypadResult) {
            return;
        }

        this.keypadResult.classList.remove("is-success", "is-error", "is-pending");
        if (state) {
            this.keypadResult.classList.add(`is-${state}`);
        }
        this.keypadResult.textContent = message;
    }

    redirectToDashboard() {
        window.setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);
    }

    redirectWithPasswordLogin() {
        window.setTimeout(() => {
            window.location.href = "index.html";
        }, 500);
    }
}
