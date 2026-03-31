const fs = require("fs");
const http = require("http");
const path = require("path");
const { handleListAccessLogs } = require("./controllers/accessLogController");
const {
  handleAccessCodeStatus,
  handleAuthorizeBiometricAccess,
  handleBiometricAccessStatus,
  handleGenerateAccessCode,
  handleValidateAccessCode,
} = require("./controllers/accessCodeController");
const { handleFaceLogin, handlePasswordLogin } = require("./controllers/authController");
const { handleHealth } = require("./controllers/healthController");
const { handleCreateReport } = require("./controllers/reportController");
const { handleAppLogoutConfig, handleLogoutSession } = require("./controllers/sessionController");
const {
  handleBulkSaveUsers,
  handleCreateUser,
  handleImportUsersExcel,
  handleListUsers,
  handleUpdateUserPassword,
} = require("./controllers/userController");
const { initDatabase, loadEnvironment } = require("./models/databaseModel");
const { ensureSystemAdministrator } = require("./models/userModel");
const { hashPassword } = require("./services/userService");
const { sendJson } = require("./views/jsonView");
const { sendFile } = require("./views/staticView");

loadEnvironment(path.resolve(__dirname, "../.env"));

const PORT = Number(process.env.PORT || 8081);
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://127.0.0.1:8080/search";
const FRONTEND_DIR = path.resolve(__dirname, "../frontend");
const FRONTEND_ASSET_EXTENSIONS = new Set([
  ".css",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".map",
  ".png",
  ".svg",
  ".webp",
]);

let databaseInitialized = false;

function getStaticPath(urlPathname) {
  const requestedPath = urlPathname === "/" ? "/login.html" : urlPathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  return path.join(FRONTEND_DIR, safePath);
}

function isAllowedFrontendPath(urlPathname) {
  if (urlPathname === "/") {
    return true;
  }

  const extension = path.extname(urlPathname).toLowerCase();
  return FRONTEND_ASSET_EXTENSIONS.has(extension);
}

async function ensureDatabase() {
  if (databaseInitialized) {
    return;
  }

  await initDatabase();
  await ensureSystemAdministrator(hashPassword);
  databaseInitialized = true;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    });
    response.end();
    return;
  }

  if (request.method === "GET" && (requestUrl.pathname === "/health" || requestUrl.pathname === "/vida")) {
    await handleHealth(response, FACE_SERVICE_URL);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/login-face") {
    await handleFaceLogin(request, response, FACE_SERVICE_URL, ensureDatabase);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/login") {
    await handlePasswordLogin(request, response, ensureDatabase);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/access-code/generate") {
    await handleGenerateAccessCode(response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/access-code/validate") {
    await handleValidateAccessCode(request, response);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/access-code/status") {
    await handleAccessCodeStatus(response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/biometric-access/authorize") {
    await handleAuthorizeBiometricAccess(request, response, ensureDatabase);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/biometric-access/status") {
    await handleBiometricAccessStatus(response, ensureDatabase);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/users") {
    await handleCreateUser(request, response, ensureDatabase);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/users/import-excel") {
    await handleImportUsersExcel(request, response, ensureDatabase);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/users") {
    await handleListUsers(response, ensureDatabase);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/access-logs") {
    await handleListAccessLogs(response, ensureDatabase);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/users/bulk-save") {
    await handleBulkSaveUsers(request, response, ensureDatabase);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/users/update-password") {
    await handleUpdateUserPassword(request, response, ensureDatabase);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/reports") {
    await handleCreateReport(request, response, ensureDatabase);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/session/logout-app") {
    await handleAppLogoutConfig(requestUrl, response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/session/logout") {
    await handleLogoutSession(response, ensureDatabase);
    return;
  }

  if (request.method === "GET") {
    if (!isAllowedFrontendPath(requestUrl.pathname)) {
      sendJson(response, 404, { error: "Recurso no encontrado" });
      return;
    }

    const filePath = getStaticPath(requestUrl.pathname);

    if (!filePath.startsWith(FRONTEND_DIR)) {
      sendJson(response, 403, { error: "Ruta no permitida" });
      return;
    }

    fs.stat(filePath, (error, stats) => {
      if (error) {
        sendJson(response, 404, { error: "Recurso no encontrado" });
        return;
      }

      if (stats.isDirectory()) {
        sendJson(response, 404, { error: "Recurso no encontrado" });
        return;
      }

      sendFile(response, filePath);
    });
    return;
  }

  sendJson(response, 405, { error: "Método no permitido" });
});

server.listen(PORT, () => {
  console.log(`Servidor Node.js activo en http://localhost:${PORT}`);
  console.log(`Sirviendo frontend desde: ${FRONTEND_DIR}`);
  console.log(`Proxy facial apuntando a: ${FACE_SERVICE_URL}`);

  ensureDatabase()
    .then(() => {
      console.log("PostgreSQL inicializado correctamente.");
    })
    .catch((error) => {
      console.warn(`PostgreSQL no disponible al iniciar: ${error.message}`);
    });
});
