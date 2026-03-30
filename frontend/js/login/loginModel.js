export class LoginModel {
    constructor() {
        this.currentStream = null;
        this.keypadBuffer = "";
    }

    getStream() {
        return this.currentStream;
    }

    setStream(stream) {
        this.currentStream = stream;
    }

    clearStream() {
        this.currentStream = null;
    }

    getIdentifier() {
        return document.getElementById("identifierInput")?.value.trim() || "";
    }

    appendKeypadDigit(digit) {
        if (this.keypadBuffer.length >= 6) {
            return this.keypadBuffer;
        }

        this.keypadBuffer += digit;
        return this.keypadBuffer;
    }

    clearKeypadBuffer() {
        this.keypadBuffer = "";
        return this.keypadBuffer;
    }

    getKeypadBuffer() {
        return this.keypadBuffer;
    }

    async sendFaceLogin(payload) {
        const response = await fetch("/login-face", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        return { response, result };
    }

    async validateAccessCode(code) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);

        const response = await fetch("/api/access-code/validate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ code }),
            signal: controller.signal
        });

        window.clearTimeout(timeoutId);
        const result = await response.json();
        return { response, result };
    }

    async getBiometricAccessStatus() {
        const response = await fetch(`/api/biometric-access/status?_t=${Date.now()}`, {
            method: "GET",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        return { response, result };
    }
}
