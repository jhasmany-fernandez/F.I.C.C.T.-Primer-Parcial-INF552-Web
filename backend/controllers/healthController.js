const { getDatabaseStatus } = require("../models/databaseModel");
const { sendJson } = require("../views/jsonView");

async function handleHealth(response, faceServiceUrl) {
  const database = await getDatabaseStatus();
  const statusCode = database.connected ? 200 : 503;

  sendJson(response, statusCode, {
    status: "ok",
    service: "backend-node",
    faceServiceUrl,
    database,
  });
}

module.exports = {
  handleHealth,
};
