const { listAccessLogs } = require("../models/accessLogModel");
const { sendJson } = require("../views/jsonView");

async function handleListAccessLogs(response, ensureDatabase) {
  try {
    await ensureDatabase();
    const logs = await listAccessLogs();

    sendJson(response, 200, {
      success: true,
      logs,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudieron listar los accesos.",
      message: error.message,
    });
  }
}

module.exports = {
  handleListAccessLogs,
};
