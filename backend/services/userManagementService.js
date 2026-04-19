// Service layer: concentra los casos de uso de administración de usuarios.
// Aquí vive la lógica de negocio entre controller y model, incluyendo
// validaciones, parsing de Excel y reglas de persistencia.
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { withTransaction } = require("../models/databaseModel");
const { upsertHorario, upsertMateria } = require("../models/academicModel");
const { getSmartLocksState } = require("../models/installationsModel");
const {
  SYSTEM_ADMIN,
  createUserRecord,
  findExistingUsersByRegistro,
  findUserByRegistro,
  listRecentUsers,
  updateUserPasswordByRegistro,
  upsertImportedUser,
} = require("../models/userModel");
const {
  buildImportedAcademicPayload,
  buildImportedUserPayload,
  hashPassword,
  mapExcelUserRows,
  TEMPORARY_PASSWORD,
  usesPendingTeacherPassword,
  validatePasswordUpdatePayload,
  validateUserPayload,
} = require("./userService");
const { cleanValue } = require("../utils/valueUtils");

// Convierte errores de dominio a un formato consistente para la capa HTTP.
function createHttpError(statusCode, error, message = null) {
  const httpError = new Error(message || error);
  httpError.statusCode = statusCode;
  httpError.publicError = error;
  return httpError;
}

function mergeReasons(...reasons) {
  return reasons.filter(Boolean).join(" ");
}

// Si la chapa está apagada, la carga masiva solo puede continuar con un Administrador autenticado.
async function authorizeAdministrativeAccess(actorRegistration) {
  const smartLocksState = await getSmartLocksState();

  if (smartLocksState.smartLocksPowerEnabled) {
    return true;
  }

  const normalizedRegistration = cleanValue(actorRegistration);
  if (!normalizedRegistration) {
    throw createHttpError(
      403,
      "Debes identificar al usuario autenticado para acceder a este módulo mientras la chapa esté apagada."
    );
  }

  const actor = await findUserByRegistro(normalizedRegistration);
  if (!actor || actor.rol !== "Administrador") {
    throw createHttpError(
      403,
      "Con la chapa apagada, solo un Administrador puede acceder a carga masiva."
    );
  }

  return true;
}

async function createManagedUser(payload) {
  const validation = validateUserPayload(payload);
  if (validation.error) {
    throw createHttpError(400, validation.error);
  }

  const { user } = validation;

  try {
    const createdUser = await createUserRecord(user, hashPassword(user.password));

    return {
      message: "Usuario registrado correctamente en PostgreSQL.",
      temporaryPasswordHint: usesPendingTeacherPassword(user) ? TEMPORARY_PASSWORD : null,
      user: createdUser,
    };
  } catch (error) {
    if (error.code === "23505") {
      throw createHttpError(409, "Ya existe un usuario con ese C.I., número de registro o correo.", error.message);
    }

    throw error;
  }
}

// La previsualización de importación admite ruta local o contenido base64 para reutilizar el mismo caso de uso.
function readWorkbookSource(payload) {
  const fileName = cleanValue(payload.fileName);
  const fileContentBase64 = cleanValue(payload.fileContentBase64);
  const filePath = cleanValue(payload.filePath);

  if (!fileContentBase64 && !filePath) {
    throw createHttpError(400, "Debes enviar el contenido del archivo o una ruta local válida.");
  }

  if (filePath) {
    if (!/\.(xlsx|xls)$/i.test(filePath)) {
      throw createHttpError(400, "La ruta indicada no corresponde a un archivo Excel válido.");
    }

    if (!fs.existsSync(filePath)) {
      throw createHttpError(404, "No se encontró el archivo Excel en la ruta indicada.");
    }

    return {
      resolvedFileName: path.basename(filePath),
      workbookSource: fs.readFileSync(filePath),
    };
  }

  if (!fileName || !fileContentBase64) {
    throw createHttpError(400, "Debes enviar el nombre y contenido del archivo Excel.");
  }

  return {
    resolvedFileName: fileName,
    workbookSource: Buffer.from(fileContentBase64, "base64"),
  };
}

// Paso de preview: parsea el Excel, valida datos académicos y marca advertencias sin persistir nada todavía.
async function importUsersFromExcelPayload(payload) {
  const { resolvedFileName, workbookSource } = readWorkbookSource(payload);

  const workbook = xlsx.read(workbookSource, {
    type: "buffer",
  });

  if (!workbook.SheetNames.length) {
    throw createHttpError(400, "El archivo Excel no contiene hojas válidas.");
  }

  let users = workbook.SheetNames.flatMap((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
    });

    return mapExcelUserRows(rawRows, sheetName).map((user) => {
      const academicValidation = buildImportedAcademicPayload(user);

      return {
        ...user,
        academicWarning: academicValidation.warning,
        canPersistAcademic: Boolean(academicValidation.academic),
        hasSchedule: Boolean(academicValidation.academic?.hasSchedule),
        hoja: sheetName,
      };
    });
  });

  let databaseWarning = null;
  try {
    const existingUsers = await findExistingUsersByRegistro(users.map((user) => user.registro));

    users = users.map((user) => {
      const existingUser = existingUsers.get(user.registro);

      return {
        ...user,
        estado: existingUser?.estado || "Pendiente",
        existsInDatabase: Boolean(existingUser),
      };
    });
  } catch (error) {
    databaseWarning = `No se pudo validar el estado contra PostgreSQL: ${error.message}`;
    users = users.map((user) => ({
      ...user,
      estado: "Pendiente",
      existsInDatabase: false,
    }));
  }

  return {
    databaseWarning,
    fileName: resolvedFileName,
    sheetNames: workbook.SheetNames,
    users,
  };
}

async function listManagedUsers() {
  return listRecentUsers();
}

async function getManagedUserProfile(registro) {
  const normalizedRegistro = cleanValue(registro);
  if (!normalizedRegistro) {
    throw createHttpError(400, "Debes enviar el número de registro a consultar.");
  }

  const user = await findUserByRegistro(normalizedRegistro);
  if (!user) {
    throw createHttpError(404, "No se encontró un usuario con ese número de registro.");
  }

  return user;
}

// Paso de guardado: crea o reutiliza el usuario y solo relaciona materia/horario si la fila académica está completa.
async function persistImportedUsers(users) {
  if (!Array.isArray(users) || !users.length) {
    throw createHttpError(400, "No hay filas importadas para guardar en base de datos.");
  }

  const results = await withTransaction(async (client) => {
    const persistedRows = [];

    for (const importedUser of users) {
      const persistedUser = await upsertImportedUser(
        importedUser,
        buildImportedUserPayload,
        hashPassword,
        client
      );
      const userId = persistedUser.user?.id;
      const academicValidation = buildImportedAcademicPayload(importedUser);
      const reason = mergeReasons(persistedUser.reason, academicValidation.warning);

      if (!userId || !academicValidation.academic) {
        persistedRows.push({
          action: persistedUser.action,
          horario: null,
          materia: null,
          reason,
          user: persistedUser.user,
        });
        continue;
      }

      const materia = await upsertMateria(client, {
        docenteId: userId,
        grupo: academicValidation.academic.grupo,
        nombreMateria: academicValidation.academic.materia,
        sigla: academicValidation.academic.sigla,
      });

      let horario = null;
      if (academicValidation.academic.hasSchedule) {
        horario = await upsertHorario(client, {
          jueves: academicValidation.academic.jueves,
          lunes: academicValidation.academic.lunes,
          materiaId: materia.id,
          martes: academicValidation.academic.martes,
          miercoles: academicValidation.academic.miercoles,
          sabado: academicValidation.academic.sabado,
          viernes: academicValidation.academic.viernes,
        });
      }

      persistedRows.push({
        action: persistedUser.action,
        horario,
        materia,
        reason,
        user: persistedUser.user,
      });
    }

    return persistedRows;
  });

  return {
    created: results.filter((item) => item.action === "created").length,
    updated: results.filter((item) => item.action === "updated").length,
    skipped: results.filter((item) => item.action === "skipped").length,
    users: results.map((item) => item.user),
    materias: results.map((item) => item.materia).filter(Boolean),
    horarios: results.map((item) => item.horario).filter(Boolean),
  };
}

// Centraliza el cambio de contraseña para mantener validación y estado en un solo punto.
async function updateManagedUserPassword(payload) {
  const validation = validatePasswordUpdatePayload(payload);
  if (validation.error) {
    throw createHttpError(400, validation.error);
  }

  const { update } = validation;
  if (update.registro === SYSTEM_ADMIN.registro) {
    throw createHttpError(403, "La contraseña del administrador del sistema no se puede modificar.");
  }

  const user = await updateUserPasswordByRegistro(update.registro, hashPassword(update.password));
  if (!user) {
    throw createHttpError(404, "No se encontró un usuario con ese número de registro.");
  }

  return {
    message: "La contraseña fue actualizada correctamente.",
    user,
  };
}

module.exports = {
  authorizeAdministrativeAccess,
  createManagedUser,
  createHttpError,
  getManagedUserProfile,
  importUsersFromExcelPayload,
  listManagedUsers,
  persistImportedUsers,
  updateManagedUserPassword,
};
