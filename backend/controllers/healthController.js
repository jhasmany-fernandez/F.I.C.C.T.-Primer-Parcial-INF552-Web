const { getDatabaseStatus } = require("../models/databaseModel");
const { sendJson } = require("../views/jsonView");

async function handleHealth(response, faceServiceUrl) {
  const database = await getDatabaseStatus();

  sendJson(response, 200, {
    status: "ok",
    service: "backend-node",
    faceServiceUrl,
    database,
  });
}

module.exports = {
  handleHealth,
};
