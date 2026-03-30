const { sendJson } = require("../views/jsonView");
const { readJsonBody } = require("../utils/httpUtils");
const {
  authorizeBiometricAccess,
  getBiometricAccessState,
} = require("../models/biometricAccessModel");

const ACCESS_CODE_TTL_MS = 5 * 60 * 1000;
const BIOMETRIC_ACCESS_TTL_MS = 90 * 1000;

let currentAccessCode = {
  code: null,
  expiresAt: 0,
  generatedAt: 0,
  generatedBy: "system",
};

function createSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getRemainingSeconds() {
  const remainingMs = Math.max(0, currentAccessCode.expiresAt - Date.now());
  return Math.ceil(remainingMs / 1000);
}

function isCodeActive() {
  return Boolean(currentAccessCode.code) && currentAccessCode.expiresAt > Date.now();
}

async function handleGenerateAccessCode(response) {
  const code = createSixDigitCode();
  const now = Date.now();

  currentAccessCode = {
    code,
    generatedAt: now,
    expiresAt: now + ACCESS_CODE_TTL_MS,
    generatedBy: "mobile-app",
  };

  sendJson(response, 200, {
    success: true,
    message: "Código temporal generado.",
    code,
    expiresAt: new Date(currentAccessCode.expiresAt).toISOString(),
    remainingSeconds: getRemainingSeconds(),
  });
}

async function handleValidateAccessCode(request, response) {
  try {
    const chunks = [];

    for await (const chunk of request) {
      chunks.push(chunk);
    }

    const rawBody = Buffer.concat(chunks).toString("utf8");
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const code = typeof payload.code === "string" ? payload.code.trim() : "";

    if (!code) {
      sendJson(response, 400, {
        success: false,
        error: "Debes ingresar un código de acceso.",
      });
      return;
    }

    if (!isCodeActive()) {
      sendJson(response, 410, {
        success: false,
        error: "No existe un código activo o ya expiró.",
      });
      return;
    }

    if (code !== currentAccessCode.code) {
      sendJson(response, 401, {
        success: false,
        error: "Código incorrecto.",
        remainingSeconds: getRemainingSeconds(),
      });
      return;
    }

    sendJson(response, 200, {
      success: true,
      message: "Acceso permitido. Código válido.",
      remainingSeconds: getRemainingSeconds(),
    });
  } catch (error) {
    sendJson(response, 400, {
      success: false,
      error: "No se pudo validar el código.",
      message: error.message,
    });
  }
}

async function handleAccessCodeStatus(response) {
  sendJson(response, 200, {
    success: true,
    active: isCodeActive(),
    remainingSeconds: getRemainingSeconds(),
  });
}

async function handleAuthorizeBiometricAccess(request, response, ensureDatabase) {
  try {
    await ensureDatabase();

    const payload = await readJsonBody(request).catch(() => ({}));
    const requestedMethod = typeof payload.method === "string" ? payload.method.trim().toLowerCase() : "";
    const method = requestedMethod === "face" ? "face" : "fingerprint";
    const source = typeof payload.source === "string" && payload.source.trim()
      ? payload.source.trim().slice(0, 40)
      : "mobile-app";

    const saved = await authorizeBiometricAccess({
      method,
      source,
      ttlMs: BIOMETRIC_ACCESS_TTL_MS,
    });

    sendJson(response, 200, {
      success: true,
      message: "Acceso biométrico autorizado.",
      method: saved.method,
      expiresAt: saved.expiresAt ? new Date(saved.expiresAt).toISOString() : null,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo autorizar el acceso biométrico.",
      message: error.message,
    });
  }
}

async function handleBiometricAccessStatus(response, ensureDatabase) {
  try {
    await ensureDatabase();
    const state = await getBiometricAccessState();

    sendJson(response, 200, {
      success: true,
      active: state.active,
      method: state.method,
      source: state.source,
      remainingSeconds: state.remainingSeconds,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo consultar el estado biométrico.",
      message: error.message,
    });
  }
}

module.exports = {
  handleAccessCodeStatus,
  handleAuthorizeBiometricAccess,
  handleBiometricAccessStatus,
  handleGenerateAccessCode,
  handleValidateAccessCode,
};
