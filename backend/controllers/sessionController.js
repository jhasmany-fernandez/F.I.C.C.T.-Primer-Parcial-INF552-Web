const { sendJson } = require("../views/jsonView");
const { revokeBiometricAccess } = require("../models/biometricAccessModel");

function getSingleQueryValue(urlObject, key) {
  const value = urlObject.searchParams.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildAppLogoutPayload(requestUrl) {
  const timestamp = new Date().toISOString();
  const source = getSingleQueryValue(requestUrl, "source") || "web";
  const screen = getSingleQueryValue(requestUrl, "screen") || "dashboard";
  const userId = getSingleQueryValue(requestUrl, "userId") || null;
  const registro = getSingleQueryValue(requestUrl, "registro") || null;
  const reason = getSingleQueryValue(requestUrl, "reason") || "user_requested";
  const scheme = getSingleQueryValue(requestUrl, "scheme") || "smartaccess";
  const fallbackUrl = getSingleQueryValue(requestUrl, "fallbackUrl") || "/login.html";

  const params = {
    action: "logout",
    client: "web",
    reason,
    registro,
    screen,
    source,
    timestamp,
    userId,
  };

  const encodedParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      encodedParams.set(key, value);
    }
  }
  encodedParams.set("fallbackUrl", fallbackUrl);

  const appUrl = `${scheme}://session/logout?${encodedParams.toString()}`;
  const androidIntentUrl = `intent://session/logout?${encodedParams.toString()}#Intent;scheme=${scheme};package=com.uagrm.smartaccess;end`;

  return {
    action: "logout",
    androidIntentUrl,
    appUrl,
    fallbackUrl,
    params,
    scheme,
  };
}

async function handleAppLogoutConfig(requestUrl, response) {
  const payload = buildAppLogoutPayload(requestUrl);

  sendJson(response, 200, {
    success: true,
    message: "Configuracion de logout hacia la app generada correctamente.",
    ...payload,
  });
}

async function handleLogoutSession(response, ensureDatabase) {
  try {
    await ensureDatabase();
    await revokeBiometricAccess();

    sendJson(response, 200, {
      success: true,
      message: "Sesion cerrada correctamente.",
      biometricAccessRevoked: true,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo cerrar la sesion.",
      message: error.message,
    });
  }
}

module.exports = {
  buildAppLogoutPayload,
  handleAppLogoutConfig,
  handleLogoutSession,
};
