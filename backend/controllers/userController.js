// MVC Controller: esta capa solo traduce HTTP hacia los casos de uso.
// Lee la request, delega reglas de negocio al service y serializa la
// respuesta con las view helpers compartidas.
const { sendJson } = require("../views/jsonView");
const { serializeUser } = require("../views/userView");
const { readJsonBody } = require("../utils/httpUtils");
const {
  authorizeAdministrativeAccess,
  createManagedUser,
  getManagedUserProfile,
  importUsersFromExcelPayload,
  listManagedUsers,
  persistImportedUsers,
  updateManagedUserPassword,
} = require("../services/userManagementService");

// Unifica el formato de error HTTP para que cada handler se concentre en el flujo feliz.
function sendUserControllerError(response, error, fallbackError) {
  sendJson(response, error.statusCode || 500, {
    success: false,
    error: error.publicError || fallbackError,
    message: error.message,
  });
}

async function handleCreateUser(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const payload = await readJsonBody(request);
    const result = await createManagedUser(payload);

    sendJson(response, 201, {
      success: true,
      message: result.message,
      temporaryPasswordHint: result.temporaryPasswordHint,
      user: serializeUser(result.user),
    });
  } catch (error) {
    sendUserControllerError(response, error, "No se pudo registrar el usuario.");
  }
}

async function handleImportUsersExcel(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    await authorizeAdministrativeAccess(request.headers["x-user-registration"]);
    const payload = await readJsonBody(request);
    const result = await importUsersFromExcelPayload(payload);

    sendJson(response, 200, {
      success: true,
      databaseWarning: result.databaseWarning,
      fileName: result.fileName,
      sheetNames: result.sheetNames,
      users: result.users,
    });
  } catch (error) {
    sendUserControllerError(response, error, "No se pudo procesar el archivo Excel.");
  }
}

async function handleListUsers(response, ensureDatabase) {
  try {
    await ensureDatabase();
    const users = await listManagedUsers();

    sendJson(response, 200, {
      success: true,
      users: users.map(serializeUser),
    });
  } catch (error) {
    sendUserControllerError(response, error, "No se pudieron listar los usuarios.");
  }
}

async function handleGetUserProfile(requestUrl, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const user = await getManagedUserProfile(requestUrl.searchParams.get("registro"));

    sendJson(response, 200, {
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    sendUserControllerError(response, error, "No se pudo consultar el perfil del usuario.");
  }
}

async function handleBulkSaveUsers(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    await authorizeAdministrativeAccess(request.headers["x-user-registration"]);
    const payload = await readJsonBody(request);
    const result = await persistImportedUsers(payload.users);

    sendJson(response, 200, {
      success: true,
      message: "Usuarios, materias y horarios fueron importados en PostgreSQL.",
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      users: result.users,
      materias: result.materias,
      horarios: result.horarios,
    });
  } catch (error) {
    sendUserControllerError(response, error, "No se pudieron guardar los usuarios importados con sus materias y horarios.");
  }
}

async function handleUpdateUserPassword(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const payload = await readJsonBody(request);
    const result = await updateManagedUserPassword(payload);

    sendJson(response, 200, {
      success: true,
      message: result.message,
      user: serializeUser(result.user),
    });
  } catch (error) {
    sendUserControllerError(response, error, "No se pudo actualizar la contraseña del usuario.");
  }
}

module.exports = {
  handleBulkSaveUsers,
  handleCreateUser,
  handleGetUserProfile,
  handleImportUsersExcel,
  handleListUsers,
  handleUpdateUserPassword,
};
