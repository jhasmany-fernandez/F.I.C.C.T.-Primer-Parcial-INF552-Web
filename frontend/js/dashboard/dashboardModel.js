export class DashboardModel {
    async loadData() {
        const [healthResponse, usersResponse, logsResponse] = await Promise.all([
            fetch("/health"),
            fetch("/api/users"),
            fetch("/api/access-logs")
        ]);

        const health = await healthResponse.json();
        const users = usersResponse.ok ? (await usersResponse.json()).users || [] : [];
        const logs = logsResponse.ok ? (await logsResponse.json()).logs || [] : [];

        return { health, users, logs };
    }
}
