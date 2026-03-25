export class DashboardController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async initialize() {
        try {
            const { health, users, logs } = await this.model.loadData();
            this.view.setHealthState(health);
            this.view.renderUsers(users);
            this.view.renderAccessLogs(logs);
        } catch (error) {
            this.view.renderLoadError();
        }
    }
}
