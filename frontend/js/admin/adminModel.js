export class AdminModel {
    async fetchDashboardData() {
        const [healthResponse, usersResponse, logsResponse] = await Promise.all([
            fetch("/health"),
            fetch("/api/users"),
            fetch("/api/access-logs")
        ]);

        return {
            health: await healthResponse.json(),
            users: usersResponse.ok ? (await usersResponse.json()).users || [] : [],
            logs: logsResponse.ok ? (await logsResponse.json()).logs || [] : []
        };
    }

    async createUser(payload) {
        const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        return { response, result: await response.json() };
    }

    async updatePassword(registro, password) {
        const response = await fetch("/api/users/update-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registro, password })
        });
        return { response, result: await response.json() };
    }

    async importExcel(fileName, fileContentBase64) {
        const response = await fetch("/api/users/import-excel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName, fileContentBase64 })
        });
        return { response, result: await response.json() };
    }

    async saveImportedUsers(users) {
        const response = await fetch("/api/users/bulk-save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ users })
        });
        return { response, result: await response.json() };
    }
}
