function formatDate(value) {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    return new Intl.DateTimeFormat("es-BO", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

export class AdminView {
    constructor() {
        this.feedbackBox = document.getElementById("adminFeedback");
        this.feedbackTitle = document.getElementById("adminFeedbackTitle");
        this.feedbackMessage = document.getElementById("adminFeedbackMessage");
        this.userForm = document.getElementById("adminUserForm");
        this.excelFileInput = document.getElementById("excelFileInput");
        this.saveImportedBtn = document.getElementById("saveImportedBtn");
        this.usersGridBody = document.getElementById("usersGridBody");
        this.usersGridCount = document.getElementById("usersGridCount");
        this.pendingImportCount = document.getElementById("pendingImportCount");
    }

    bind(controller) {
        this.userForm?.addEventListener("submit", (event) => controller.handleCreateUser(event));
        this.excelFileInput?.addEventListener("change", () => controller.handleExcelImport());
        this.saveImportedBtn?.addEventListener("click", () => controller.handleSaveImportedUsers());
        window.handleAdminCredentialClick = (registro) => controller.handleCredentialClick(registro);
    }

    getFormPayload() {
        return {
            ci: document.getElementById("ciInput").value.trim(),
            registro: document.getElementById("registroInput").value.trim(),
            nombre: document.getElementById("nombreInput").value.trim(),
            apellido: document.getElementById("apellidoInput").value.trim(),
            correo: document.getElementById("correoInput").value.trim(),
            rol: document.getElementById("rolInput").value,
            estado: document.getElementById("estadoInput").value,
            password: document.getElementById("passwordInput").value
        };
    }

    getSelectedFile() {
        return this.excelFileInput?.files?.[0] || null;
    }

    resetForm() {
        this.userForm?.reset();
    }

    showFeedback(type, title, message) {
        this.feedbackBox.classList.remove("is-hidden", "is-error", "is-warning", "is-info");
        if (type) {
            this.feedbackBox.classList.add(`is-${type}`);
        }
        this.feedbackTitle.textContent = title;
        this.feedbackMessage.textContent = message;
    }

    setHealthState(health) {
        const dbAvailable = Boolean(health?.database?.available);
        document.getElementById("adminStatusText").textContent = dbAvailable
            ? "Servicios administrativos disponibles"
            : "Panel activo con revisión pendiente de PostgreSQL";
        document.getElementById("backendStatus").textContent = health?.status === "ok" ? "Activo" : "Sin respuesta";
        document.getElementById("databaseStatus").textContent = dbAvailable ? "Conectado" : "Pendiente";
        document.getElementById("faceServiceStatus").textContent = health?.faceServiceUrl ? "Configurado" : "Sin configurar";
    }

    renderUsers(users) {
        document.getElementById("usersCount").textContent = String(users.length);
        document.getElementById("latestUser").textContent = users.length ? users[0].registro : "Sin datos";
        this.usersGridCount.textContent = `${users.length} fila${users.length === 1 ? "" : "s"}`;

        const roster = document.getElementById("usersRoster");
        if (!users.length) {
            roster.innerHTML = '<div class="roster-item"><strong>No hay usuarios aún</strong><span>Registra o importa la primera cuenta.</span></div>';
            this.usersGridBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);">No hay usuarios registrados todavía.</td></tr>';
            return;
        }

        roster.innerHTML = users.slice(0, 5).map((user) => `
            <div class="roster-item">
                <strong>${user.nombre} ${user.apellido}</strong>
                <span>${user.registro} · ${user.rol} · ${user.estado}</span>
            </div>
        `).join("");

        this.usersGridBody.innerHTML = users.map((user, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${user.nombre}</td>
                <td>${user.apellido}</td>
                <td>${user.registro}</td>
                <td>${user.correo}</td>
                <td>${user.rol || "Sin asignar"}</td>
                <td>${user.estado || "Pendiente"}</td>
                <td style="text-align:center;"><button type="button" class="badge badge-blue" style="border:none;cursor:pointer;" onclick="handleAdminCredentialClick('${user.registro}')">Clave</button></td>
            </tr>
        `).join("");
    }

    renderImportedUsers(users) {
        this.pendingImportCount.textContent = String(users.length);
        this.usersGridCount.textContent = `${users.length} fila${users.length === 1 ? "" : "s"}`;

        if (!users.length) {
            this.usersGridBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);">No se importaron filas válidas.</td></tr>';
            return;
        }

        this.usersGridBody.innerHTML = users.map((user, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${user.nombre}</td>
                <td>${user.apellido}</td>
                <td>${user.registro}</td>
                <td>${user.correo}</td>
                <td>${user.rol || "Sin asignar"}</td>
                <td>${user.estado || "Pendiente"}</td>
                <td style="text-align:center;">${user.existsInDatabase ? "Existe" : "Nuevo"}</td>
            </tr>
        `).join("");
    }

    renderAccessLogs(logs) {
        document.getElementById("accessLogsCount").textContent = String(logs.length);
        document.getElementById("latestAccess").textContent = logs.length ? formatDate(logs[0].created_at) : "Sin datos";
        const accessFeed = document.getElementById("accessFeed");

        if (!logs.length) {
            accessFeed.innerHTML = '<div class="activity-item"><div class="activity-icon blue">i</div><div class="activity-content"><div class="activity-text">Todavía no hay accesos registrados.</div><div class="activity-time">Aparecerán aquí cuando el sistema se utilice.</div></div></div>';
            return;
        }

        accessFeed.innerHTML = logs.slice(0, 5).map((log) => `
            <div class="activity-item">
                <div class="activity-icon ${log.success ? "green" : "orange"}">${log.success ? "OK" : "!"}</div>
                <div class="activity-content">
                    <div class="activity-text"><strong>${log.registro || log.identifier || "Sin identificador"}</strong> ${log.success ? "validó acceso correctamente." : "registró un intento fallido."}</div>
                    <div class="activity-time">${formatDate(log.created_at)} · ${log.reason || "Evento registrado"}</div>
                </div>
            </div>
        `).join("");
    }

    promptPassword(registro) {
        return window.prompt(`Asignar nueva contraseña para el registro ${registro}:`);
    }

    confirmSaveImportedUsers() {
        return window.confirm("El Excel se cargó correctamente. ¿Quieres guardar estos registros en la base de datos ahora?");
    }
}
