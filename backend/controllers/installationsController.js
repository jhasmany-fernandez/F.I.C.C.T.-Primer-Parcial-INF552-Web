const { applySmartLocksAction, getSmartLocksState } = require("../models/installationsModel");
const { findUserByRegistro } = require("../models/userModel");
const { readJsonBody } = require("../utils/httpUtils");
const { cleanValue } = require("../utils/valueUtils");
const { sendJson } = require("../views/jsonView");

function validatePayload(payload, expectedAction) {
  const normalized = {
    action: cleanValue(payload.action),
    authMethod: cleanValue(payload.authMethod).toLowerCase(),
    moduleName: cleanValue(payload.moduleName),
    operatorName: cleanValue(payload.operatorName),
    operatorRegistration: cleanValue(payload.operatorRegistration),
  };

  if (normalized.action !== expectedAction) {
    return { error: "La acción enviada no coincide con el endpoint solicitado." };
  }

  if (!normalized.operatorRegistration) {
    return { error: "operatorRegistration es obligatorio." };
  }

  if (!normalized.operatorName) {
    return { error: "operatorName es obligatorio." };
  }

  if (!normalized.moduleName) {
    return { error: "moduleName es obligatorio." };
  }

  if (!["face", "fingerprint"].includes(normalized.authMethod)) {
    return { error: "authMethod debe ser 'face' o 'fingerprint'." };
  }

  return { payload: normalized };
}

async function handleSmartLocksCommand(request, response, ensureDatabase, expectedAction) {
  try {
    await ensureDatabase();
    const rawPayload = await readJsonBody(request);
    const validation = validatePayload(rawPayload, expectedAction);

    if (validation.error) {
      sendJson(response, 400, {
        success: false,
        error: validation.error,
      });
      return;
    }

    const operator = await findUserByRegistro(validation.payload.operatorRegistration);
    if (!operator) {
      sendJson(response, 404, {
        success: false,
        error: "No se encontró el usuario operador para esta acción.",
      });
      return;
    }

    if (operator.rol !== "Administrador") {
      sendJson(response, 403, {
        success: false,
        error: "Solo un usuario con rol Administrador puede encender o apagar la chapa inteligente.",
      });
      return;
    }

    const state = await applySmartLocksAction(validation.payload);
    sendJson(response, 200, {
      success: true,
      message: "Orden aplicada correctamente.",
      moduleName: state.moduleName,
      action: state.action,
      smartLocksPowerEnabled: state.smartLocksPowerEnabled,
      intelligentModeEnabled: state.intelligentModeEnabled,
      authMethod: state.authMethod,
      updatedAt: state.updatedAt,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo aplicar la orden de instalaciones inteligentes.",
      message: error.message,
    });
  }
}

async function handleEnableSmartLocks(request, response, ensureDatabase) {
  await handleSmartLocksCommand(request, response, ensureDatabase, "enable_smart_locks");
}

async function handleDisableSmartLocks(request, response, ensureDatabase) {
  await handleSmartLocksCommand(request, response, ensureDatabase, "disable_smart_locks");
}

async function handleGetSmartLocksState(response, ensureDatabase) {
  try {
    await ensureDatabase();
    const state = await getSmartLocksState();
    sendJson(response, 200, {
      success: true,
      ...state,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo consultar el estado de instalaciones inteligentes.",
      message: error.message,
    });
  }
}

module.exports = {
  handleDisableSmartLocks,
  handleEnableSmartLocks,
  handleGetSmartLocksState,
};
