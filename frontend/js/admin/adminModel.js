export class AdminModel {
    buildApiUrl(path) {
        return typeof window.buildSmartAccessApiUrl === "function"
            ? window.buildSmartAccessApiUrl(path)
            : `${window.location.origin}${path}`;
    }

    buildHeaders() {
        const headers = {
            "Content-Type": "application/json"
        };
        const currentUser = window.getSmartAccessCurrentUser?.();
        if (currentUser?.registro) {
            headers["X-User-Registration"] = currentUser.registro;
        }
        return headers;
    }

    async fetchDashboardData() {
        const [healthResponse, usersResponse, logsResponse] = await Promise.all([
            fetch(this.buildApiUrl("/health")),
            fetch(this.buildApiUrl("/api/users")),
            fetch(this.buildApiUrl("/api/access-logs"))
        ]);

        return {
            health: await healthResponse.json(),
            users: usersResponse.ok ? (await usersResponse.json()).users || [] : [],
            logs: logsResponse.ok ? (await logsResponse.json()).logs || [] : []
        };
    }

    async createUser(payload) {
        const response = await fetch(this.buildApiUrl("/api/users"), {
            method: "POST",
            headers: this.buildHeaders(),
            body: JSON.stringify(payload)
        });
        return { response, result: await response.json() };
    }

    async updatePassword(registro, password) {
        const response = await fetch(this.buildApiUrl("/api/users/update-password"), {
            method: "POST",
            headers: this.buildHeaders(),
            body: JSON.stringify({ registro, password })
        });
        return { response, result: await response.json() };
    }

    async importExcel(fileName, fileContentBase64) {
        const response = await fetch(this.buildApiUrl("/api/users/import-excel"), {
            method: "POST",
            headers: this.buildHeaders(),
            body: JSON.stringify({ fileName, fileContentBase64 })
        });
        return { response, result: await response.json() };
    }

    async saveImportedUsers(users) {
        const response = await fetch(this.buildApiUrl("/api/users/bulk-save"), {
            method: "POST",
            headers: this.buildHeaders(),
            body: JSON.stringify({ users })
        });
        return { response, result: await response.json() };
    }

    async getSmartLocksState() {
        const response = await fetch(this.buildApiUrl(`/api/installations/smart-locks/status?_t=${Date.now()}`), {
            method: "GET",
            cache: "no-store",
            headers: this.buildHeaders()
        });

        return { response, result: await response.json() };
    }

    async getUserProfile(registro) {
        const response = await fetch(this.buildApiUrl(`/api/users/profile?registro=${encodeURIComponent(registro)}`), {
            method: "GET",
            cache: "no-store",
            headers: this.buildHeaders()
        });

        return { response, result: await response.json() };
    }
}
