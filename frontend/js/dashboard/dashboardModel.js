export class DashboardModel {
    buildApiUrl(path) {
        return typeof window.buildSmartAccessApiUrl === "function"
            ? window.buildSmartAccessApiUrl(path)
            : `${window.location.origin}${path}`;
    }

    async loadData() {
        const [healthResponse, usersResponse, logsResponse] = await Promise.all([
            fetch(this.buildApiUrl("/health")),
            fetch(this.buildApiUrl("/api/users")),
            fetch(this.buildApiUrl("/api/access-logs"))
        ]);

        const health = await healthResponse.json();
        const users = usersResponse.ok ? (await usersResponse.json()).users || [] : [];
        const logs = logsResponse.ok ? (await logsResponse.json()).logs || [] : [];

        return { health, users, logs };
    }
}
