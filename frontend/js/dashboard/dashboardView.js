function formatDate(value) {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    return new Intl.DateTimeFormat("es-BO", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

export class DashboardView {
    setHealthState(health) {
        const dbAvailable = Boolean(health?.database?.available);
        document.getElementById("heroStatusText").textContent = dbAvailable
            ? "Servicios base activos y listos para operar"
            : "Backend activo con revisión pendiente de PostgreSQL";
        document.getElementById("backendStatus").textContent = health?.status === "ok" ? "Activo" : "Sin respuesta";
        document.getElementById("databaseStatus").textContent = dbAvailable ? "Conectado" : "Pendiente";
        document.getElementById("faceServiceStatus").textContent = health?.faceServiceUrl ? "Configurado" : "Sin configurar";
    }

    renderUsers(users) {
        const usersCount = document.getElementById("usersCount");
        const latestUser = document.getElementById("latestUser");
        const usersRoster = document.getElementById("usersRoster");

        usersCount.textContent = String(users.length);

        if (!users.length) {
            latestUser.textContent = "Sin usuarios";
            usersRoster.innerHTML = '<div class="roster-item"><strong>No hay usuarios aún</strong><span>Registra el primero desde el formulario.</span></div>';
            return;
        }

        latestUser.textContent = users[0].registro;
        usersRoster.innerHTML = users.slice(0, 5).map((user) => `
            <div class="roster-item">
                <strong>${user.nombre} ${user.apellido}</strong>
                <span>${user.registro} · ${user.rol} · ${user.estado}</span>
            </div>
        `).join("");
    }

    renderAccessLogs(logs) {
        const accessLogsCount = document.getElementById("accessLogsCount");
        const latestAccess = document.getElementById("latestAccess");
        const accessFeed = document.getElementById("accessFeed");

        accessLogsCount.textContent = String(logs.length);

        if (!logs.length) {
            latestAccess.textContent = "Sin eventos";
            accessFeed.innerHTML = '<div class="activity-item"><div class="activity-icon blue">i</div><div class="activity-content"><div class="activity-text">Todavía no hay eventos de acceso.</div><div class="activity-time">Cuando uses la validación facial aparecerán aquí.</div></div></div>';
            return;
        }

        latestAccess.textContent = formatDate(logs[0].created_at);
        accessFeed.innerHTML = logs.slice(0, 5).map((log) => `
            <div class="activity-item">
                <div class="activity-icon ${log.success ? "green" : "orange"}">${log.success ? "OK" : "!"}</div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong>${log.registro || log.identifier || "Sin identificador"}</strong>
                        ${log.success ? "validó acceso correctamente." : "registró un intento fallido."}
                    </div>
                    <div class="activity-time">
                        ${formatDate(log.created_at)} · ${log.reason || "Evento registrado"}
                    </div>
                </div>
            </div>
        `).join("");
    }

    renderLoadError() {
        document.getElementById("heroStatusText").textContent = "No se pudo cargar el dashboard desde el backend";
        document.getElementById("backendStatus").textContent = "Error";
        document.getElementById("databaseStatus").textContent = "Error";
        document.getElementById("faceServiceStatus").textContent = "Error";
    }
}
