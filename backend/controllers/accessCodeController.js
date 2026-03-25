const { sendJson } = require("../views/jsonView");
const { readJsonBody } = require("../utils/httpUtils");

const ACCESS_CODE_TTL_MS = 5 * 60 * 1000;
const BIOMETRIC_ACCESS_TTL_MS = 30 * 1000;

let currentAccessCode = {
  code: null,
  expiresAt: 0,
  generatedAt: 0,
  generatedBy: "system",
};

let biometricAccess = {
  active: false,
  authorizedAt: 0,
  expiresAt: 0,
  source: "mobile-app",
  method: "fingerprint",
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

function isBiometricAccessActive() {
  return biometricAccess.active && biometricAccess.expiresAt > Date.now();
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

async function handleAuthorizeBiometricAccess(request, response) {
  const payload = await readJsonBody(request).catch(() => ({}));
  const requestedMethod = typeof payload.method === "string" ? payload.method.trim().toLowerCase() : "";
  const method = requestedMethod === "face" ? "face" : "fingerprint";
  const now = Date.now();
  biometricAccess = {
    active: true,
    authorizedAt: now,
    expiresAt: now + BIOMETRIC_ACCESS_TTL_MS,
    source: "mobile-app",
    method,
  };

  sendJson(response, 200, {
    success: true,
    message: "Acceso biométrico autorizado.",
    method: biometricAccess.method,
    expiresAt: new Date(biometricAccess.expiresAt).toISOString(),
  });
}

async function handleBiometricAccessStatus(response) {
  const active = isBiometricAccessActive();

  if (!active) {
    biometricAccess.active = false;
  }

  sendJson(response, 200, {
    success: true,
    active,
    method: biometricAccess.method,
    source: biometricAccess.source,
    remainingSeconds: active
      ? Math.ceil(Math.max(0, biometricAccess.expiresAt - Date.now()) / 1000)
      : 0,
  });
}

module.exports = {
  handleAccessCodeStatus,
  handleAuthorizeBiometricAccess,
  handleBiometricAccessStatus,
  handleGenerateAccessCode,
  handleValidateAccessCode,
};
