export class AdminController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.pendingImportedUsers = [];
    }

    async initialize() {
        this.view.bind(this);
        await this.reloadData();
    }

    async reloadData() {
        try {
            const { health, users, logs } = await this.model.fetchDashboardData();
            this.view.setHealthState(health);
            this.view.renderUsers(users);
            this.view.renderAccessLogs(logs);
            this.view.pendingImportCount.textContent = String(this.pendingImportedUsers.length);
        } catch (error) {
            this.view.showFeedback("error", "No se pudo cargar el panel", error.message || "Error al cargar datos administrativos.");
        }
    }

    async handleCreateUser(event) {
        event.preventDefault();
        try {
            const payload = this.view.getFormPayload();
            const { response, result } = await this.model.createUser(payload);
            if (!response.ok) {
                throw new Error(result.error || result.message || "No se pudo registrar el usuario.");
            }
            this.view.resetForm();
            this.view.showFeedback(null, "Usuario registrado", `La cuenta ${result.user?.registro || payload.registro} fue creada correctamente.`);
            await this.reloadData();
        } catch (error) {
            this.view.showFeedback("error", "No se pudo registrar el usuario", error.message);
        }
    }

    async handleCredentialClick(registro) {
        const newPassword = this.view.promptPassword(registro);
        if (newPassword === null) return;
        if (newPassword.trim().length < 8) {
            this.view.showFeedback("warning", "Contraseña no válida", "La nueva contraseña debe tener al menos 8 caracteres.");
            return;
        }

        try {
            const { response, result } = await this.model.updatePassword(registro, newPassword.trim());
            if (!response.ok) {
                throw new Error(result.error || result.message || "No se pudo actualizar la contraseña.");
            }
            this.view.showFeedback(null, "Credencial actualizada", `La contraseña del registro ${registro} fue actualizada.`);
            await this.reloadData();
        } catch (error) {
            this.view.showFeedback("error", "No se pudo actualizar la contraseña", error.message);
        }
    }

    async handleExcelImport() {
        const selectedFile = this.view.getSelectedFile();
        if (!selectedFile) {
            this.view.showFeedback("warning", "Selecciona un archivo Excel", "Debes elegir un archivo .xlsx o .xls antes de cargarlo.");
            return;
        }

        try {
            const fileContentBase64 = await this.fileToBase64(selectedFile);
            const { response, result } = await this.model.importExcel(selectedFile.name, fileContentBase64);
            if (!response.ok) {
                throw new Error(result.error || result.message || "No se pudo importar el Excel.");
            }

            this.pendingImportedUsers = result.users || [];
            this.view.renderImportedUsers(this.pendingImportedUsers);
            this.view.showFeedback(null, "Excel cargado correctamente", result.databaseWarning || `Se importaron ${this.pendingImportedUsers.length} filas desde ${result.fileName}.`);

            if (this.pendingImportedUsers.length && this.view.confirmSaveImportedUsers()) {
                await this.handleSaveImportedUsers();
            }
        } catch (error) {
            this.view.showFeedback("error", "No se pudo cargar el Excel", error.message);
        }
    }

    async handleSaveImportedUsers() {
        if (!this.pendingImportedUsers.length) {
            this.view.showFeedback("warning", "No hay datos importados", "Primero carga un archivo Excel antes de guardar.");
            return;
        }

        try {
            const { response, result } = await this.model.saveImportedUsers(this.pendingImportedUsers);
            if (!response.ok) {
                throw new Error(result.error || result.message || "No se pudieron guardar los usuarios importados.");
            }
            this.pendingImportedUsers = [];
            this.view.pendingImportCount.textContent = "0";
            this.view.showFeedback(null, "Datos guardados correctamente", `Se guardaron ${result.created || 0} nuevos y se omitieron ${result.skipped || 0} registros ya existentes.`);
            await this.reloadData();
        } catch (error) {
            this.view.showFeedback("error", "No se pudo guardar en base de datos", error.message);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = String(reader.result || "");
                resolve(result.includes(",") ? result.split(",")[1] : result);
            };
            reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado."));
            reader.readAsDataURL(file);
        });
    }
}
