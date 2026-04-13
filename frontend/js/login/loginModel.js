export class LoginModel {
    constructor() {
        this.currentStream = null;
        this.keypadBuffer = "";
        this.apiBaseUrl = typeof window.resolveSmartAccessApiBaseUrl === "function"
            ? window.resolveSmartAccessApiBaseUrl()
            : window.location.origin;
    }

    buildApiUrl(path) {
        return `${this.apiBaseUrl}${path}`;
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
        const response = await fetch(this.buildApiUrl("/login-face"), {
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

        const response = await fetch(this.buildApiUrl("/api/access-code/validate"), {
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
        const response = await fetch(this.buildApiUrl(`/api/biometric-access/status?_t=${Date.now()}`), {
            method: "GET",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        return { response, result };
    }

    async getSmartLocksState() {
        const response = await fetch(this.buildApiUrl(`/api/installations/smart-locks/status?_t=${Date.now()}`), {
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
