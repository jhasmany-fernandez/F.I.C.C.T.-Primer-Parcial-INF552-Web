const { createAccessLog, findUserByExternalId } = require("../models/accessLogModel");
const { findUserForLogin } = require("../models/userModel");
const { proxyFaceLogin } = require("../services/faceRecognitionService");
const { isTemporaryPassword, TEMPORARY_PASSWORD, verifyPassword } = require("../services/userService");
const { readJsonBody } = require("../utils/httpUtils");
const { cleanValue } = require("../utils/valueUtils");
const { serializeUser } = require("../views/userView");
const { sendJson } = require("../views/jsonView");

async function handlePasswordLogin(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const payload = await readJsonBody(request);
    const registro = cleanValue(payload.registro);
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!registro || !password) {
      sendJson(response, 400, {
        success: false,
        error: "El número de registro y la contraseña son obligatorios.",
      });
      return;
    }

    const user = await findUserForLogin(registro);

    if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
      await createAccessLog({
        identifier: registro,
        reason: "Credenciales inválidas.",
        success: false,
      }, ensureDatabase);

      sendJson(response, 401, {
        success: false,
        error: "Número de registro o contraseña incorrectos.",
      });
      return;
    }

    const requirePasswordReset = user.estado === "Pendiente" || isTemporaryPassword(password);

    await createAccessLog({
      identifier: registro,
      reason: requirePasswordReset
        ? "Inicio de sesión con contraseña temporal."
        : "Inicio de sesión exitoso por contraseña.",
      success: true,
      userId: user.id,
    }, ensureDatabase);

    sendJson(response, 200, {
      success: true,
      message: requirePasswordReset
        ? "Debes cambiar tu contraseña temporal para continuar."
        : "Inicio de sesión correcto.",
      requirePasswordReset,
      temporaryPasswordHint: requirePasswordReset ? TEMPORARY_PASSWORD : null,
      user: serializeUser(user),
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo completar el inicio de sesión.",
      message: error.message,
    });
  }
}

async function handleFaceLogin(request, response, faceServiceUrl, ensureDatabase) {
  let payload = {};

  try {
    payload = await readJsonBody(request);

    if (!payload.image) {
      sendJson(response, 400, {
        success: false,
        error: "La imagen es obligatoria.",
      });
      return;
    }

    const result = await proxyFaceLogin(payload, faceServiceUrl);

    if (!result.body.success) {
      await createAccessLog({
        identifier: payload.identifier,
        reason: result.body.message || result.body.error,
        success: false,
      }, ensureDatabase);
      sendJson(response, result.statusCode, result.body);
      return;
    }

    const matchedFaceId = cleanValue(result.body.userId);
    const requestedIdentifier = cleanValue(payload.identifier);

    if (requestedIdentifier && matchedFaceId && requestedIdentifier !== matchedFaceId) {
      await createAccessLog({
        identifier: requestedIdentifier,
        matchedFaceId,
        reason: "El rostro detectado no coincide con el identificador solicitado.",
        similarity: result.body.similarity,
        success: false,
      }, ensureDatabase);

      sendJson(response, 401, {
        success: false,
        error: "La identidad facial no coincide con el número de registro ingresado.",
        matchedFaceId,
      });
      return;
    }

    let user = null;
    let warning = null;

    try {
      await ensureDatabase();
      user = await findUserByExternalId(matchedFaceId || requestedIdentifier);
      await createAccessLog({
        identifier: requestedIdentifier || matchedFaceId,
        matchedFaceId,
        reason: "Acceso facial exitoso.",
        similarity: result.body.similarity,
        success: true,
        userId: user?.id,
      }, ensureDatabase);
    } catch (error) {
      warning = `No se pudo consultar PostgreSQL: ${error.message}`;
    }

    sendJson(response, 200, {
      ...result.body,
      user: serializeUser(user),
      warning,
    });
  } catch (error) {
    await createAccessLog({
      identifier: payload.identifier,
      reason: error.message,
      success: false,
    }, ensureDatabase);

    sendJson(response, 502, {
      success: false,
      error: "No se pudo completar el login facial.",
      message: `${error.message} Verifica que el servicio facial esté activo en ${faceServiceUrl}.`,
    });
  }
}

module.exports = {
  handleFaceLogin,
  handlePasswordLogin,
};
