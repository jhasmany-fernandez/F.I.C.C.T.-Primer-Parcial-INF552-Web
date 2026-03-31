const { readJsonBody } = require("../utils/httpUtils");
const { sendJson } = require("../views/jsonView");
const {
  activateMobileSession,
  getMobileSessionStatus,
  invalidateAllActiveMobileSessions,
  invalidateMobileSession,
  normalizeSessionIdentity,
} = require("../models/mobileSessionModel");

function buildIdentityFromQuery(requestUrl) {
  return {
    deviceId: requestUrl.searchParams.get("deviceId") || "",
    reason: requestUrl.searchParams.get("reason") || "",
    registro: requestUrl.searchParams.get("registro") || "",
    source: requestUrl.searchParams.get("source") || "mobile-app",
    userId: requestUrl.searchParams.get("userId") || "",
  };
}

async function handleActivateMobileSession(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const payload = await readJsonBody(request);
    const result = await activateMobileSession(payload);

    if (result.error) {
      sendJson(response, 400, {
        success: false,
        error: result.error,
      });
      return;
    }

    sendJson(response, 200, {
      success: true,
      message: "Sesion movil activada.",
      session: result,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo activar la sesion movil.",
      message: error.message,
    });
  }
}

async function handleMobileSessionStatus(requestUrl, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const payload = buildIdentityFromQuery(requestUrl);
    const validation = normalizeSessionIdentity(payload);

    if (validation.error) {
      sendJson(response, 400, {
        success: false,
        error: validation.error,
      });
      return;
    }

    const status = await getMobileSessionStatus(payload);
    sendJson(response, 200, {
      success: true,
      active: status.active !== false,
      reason: status.logout_reason || null,
      registro: status.registro || null,
      updatedAt: status.updated_at || null,
      userId: status.user_id || null,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo consultar la sesion movil.",
      message: error.message,
    });
  }
}

async function handleInvalidateMobileSession(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const payload = await readJsonBody(request);

    if (payload.allActive === true) {
      const sessions = await invalidateAllActiveMobileSessions(payload);
      sendJson(response, 200, {
        success: true,
        message: "Sesiones móviles activas invalidadas.",
        invalidated: sessions.length,
        sessions,
      });
      return;
    }

    const result = await invalidateMobileSession(payload);

    if (result.error) {
      sendJson(response, 400, {
        success: false,
        error: result.error,
      });
      return;
    }

    sendJson(response, 200, {
      success: true,
      message: "Sesion movil invalidada.",
      session: result,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo invalidar la sesion movil.",
      message: error.message,
    });
  }
}

module.exports = {
  handleActivateMobileSession,
  handleInvalidateMobileSession,
  handleMobileSessionStatus,
};
