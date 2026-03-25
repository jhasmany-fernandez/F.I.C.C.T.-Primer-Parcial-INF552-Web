const { createReport } = require("../models/reportModel");
const { sendJson } = require("../views/jsonView");
const { readJsonBody } = require("../utils/httpUtils");
const { cleanValue } = require("../utils/valueUtils");

function validateReportPayload(payload) {
  const report = {
    reporterRegistro: cleanValue(payload.reporterRegistro),
    reporterNombre: cleanValue(payload.reporterNombre),
    problemType: cleanValue(payload.problemType),
    problemState: cleanValue(payload.problemState),
    priority: cleanValue(payload.priority),
    description: cleanValue(payload.description),
    evidenceImageBase64: cleanValue(payload.evidenceImageBase64),
  };

  if (!report.reporterRegistro) {
    return { error: "No se recibió el número de registro del usuario logueado." };
  }

  if (!report.problemType) {
    return { error: "Debes seleccionar el tipo de problema." };
  }

  if (!report.problemState) {
    return { error: "Debes seleccionar el estado del problema." };
  }

  if (!report.priority) {
    return { error: "No se pudo determinar la prioridad del reporte." };
  }

  if (!report.description) {
    return { error: "Debes escribir una descripción del reporte." };
  }

  return { report };
}

async function handleCreateReport(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const payload = await readJsonBody(request);
    const validation = validateReportPayload(payload);

    if (validation.error) {
      sendJson(response, 400, {
        success: false,
        error: validation.error,
      });
      return;
    }

    const savedReport = await createReport(validation.report);

    sendJson(response, 201, {
      success: true,
      message: "Reporte registrado correctamente.",
      report: savedReport,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo registrar el reporte.",
      message: error.message,
    });
  }
}

module.exports = {
  handleCreateReport,
};
