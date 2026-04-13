const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const {
  query,
  withTransaction,
} = require("../models/databaseModel");
const {
  upsertHorario,
  upsertMateria,
} = require("../models/academicModel");
const {
  SYSTEM_ADMIN,
  findExistingUsersByRegistro,
  findUserByRegistro,
  upsertImportedUser,
} = require("../models/userModel");
const { getSmartLocksState } = require("../models/installationsModel");
const { sendJson } = require("../views/jsonView");
const { serializeUser } = require("../views/userView");
const { readJsonBody } = require("../utils/httpUtils");
const {
  buildImportedUserPayload,
  hashPassword,
  mapExcelUserRows,
  validatePasswordUpdatePayload,
  validateUserPayload,
} = require("../services/userService");
const { cleanValue } = require("../utils/valueUtils");

async function authorizeAdministrativeAccess(request, response, ensureDatabase) {
  await ensureDatabase();
  const smartLocksState = await getSmartLocksState();

  if (smartLocksState.smartLocksPowerEnabled) {
    return true;
  }

  const actorRegistration = cleanValue(request.headers["x-user-registration"]);
  if (!actorRegistration) {
    sendJson(response, 403, {
      success: false,
      error: "Debes identificar al usuario autenticado para acceder a este módulo mientras la chapa esté apagada.",
    });
    return false;
  }

  const actor = await findUserByRegistro(actorRegistration);
  if (!actor || actor.rol !== "Administrador") {
    sendJson(response, 403, {
      success: false,
      error: "Con la chapa apagada, solo un Administrador puede acceder a carga masiva.",
    });
    return false;
  }

  return true;
}

async function handleCreateUser(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const payload = await readJsonBody(request);
    const validation = validateUserPayload(payload);

    if (validation.error) {
      sendJson(response, 400, {
        success: false,
        error: validation.error,
      });
      return;
    }

    const { user } = validation;
    const passwordHash = hashPassword(user.password);
    const result = await query(
      `
        INSERT INTO usuarios (
          ci,
          registro,
          nombre,
          apellido,
          correo,
          hash_contrasena,
          rol,
          estado,
          id_rostro_externo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, ci, registro, nombre, apellido, correo, rol, estado, id_rostro_externo, creado_en
      `,
      [
        user.ci,
        user.registro,
        user.nombre,
        user.apellido,
        user.correo,
        passwordHash,
        user.rol,
        user.estado,
        user.registro,
      ]
    );

    sendJson(response, 201, {
      success: true,
      message: "Usuario registrado correctamente en PostgreSQL.",
      user: serializeUser(result.rows[0]),
    });
  } catch (error) {
    if (error.code === "23505") {
      sendJson(response, 409, {
        success: false,
        error: "Ya existe un usuario con ese C.I., número de registro o correo.",
      });
      return;
    }

    sendJson(response, 500, {
      success: false,
      error: "No se pudo registrar el usuario.",
      message: error.message,
    });
  }
}

async function handleImportUsersExcel(request, response, ensureDatabase) {
  try {
    const allowed = await authorizeAdministrativeAccess(request, response, ensureDatabase);
    if (!allowed) {
      return;
    }

    const payload = await readJsonBody(request);
    const fileName = cleanValue(payload.fileName);
    const fileContentBase64 = cleanValue(payload.fileContentBase64);
    const filePath = cleanValue(payload.filePath);

    if (!fileContentBase64 && !filePath) {
      sendJson(response, 400, {
        success: false,
        error: "Debes enviar el contenido del archivo o una ruta local válida.",
      });
      return;
    }

    let workbookSource;
    let resolvedFileName = fileName;

    if (filePath) {
      if (!/\.(xlsx|xls)$/i.test(filePath)) {
        sendJson(response, 400, {
          success: false,
          error: "La ruta indicada no corresponde a un archivo Excel válido.",
        });
        return;
      }

      if (!fs.existsSync(filePath)) {
        sendJson(response, 404, {
          success: false,
          error: "No se encontró el archivo Excel en la ruta indicada.",
        });
        return;
      }

      workbookSource = fs.readFileSync(filePath);
      resolvedFileName = path.basename(filePath);
    } else {
      if (!fileName || !fileContentBase64) {
        sendJson(response, 400, {
          success: false,
          error: "Debes enviar el nombre y contenido del archivo Excel.",
        });
        return;
      }

      workbookSource = Buffer.from(fileContentBase64, "base64");
    }

    const workbook = xlsx.read(workbookSource, {
      type: "buffer",
    });
    if (!workbook.SheetNames.length) {
      sendJson(response, 400, {
        success: false,
        error: "El archivo Excel no contiene hojas válidas.",
      });
      return;
    }

    let users = workbook.SheetNames.flatMap((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = xlsx.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });

      return mapExcelUserRows(rawRows, sheetName).map((user) => ({
        ...user,
        hoja: sheetName,
      }));
    });

    let databaseWarning = null;
    try {
      await ensureDatabase();
      const existingUsers = await findExistingUsersByRegistro(users.map((user) => user.registro));

      users = users.map((user) => {
        const existingUser = existingUsers.get(user.registro);
        const hasPasswordAssigned = Boolean(existingUser?.hash_contrasena);

        return {
          ...user,
          estado: hasPasswordAssigned ? "Activo" : "Pendiente",
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

    sendJson(response, 200, {
      success: true,
      databaseWarning,
      fileName: resolvedFileName,
      sheetNames: workbook.SheetNames,
      users,
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo procesar el archivo Excel.",
      message: error.message,
    });
  }
}

async function handleListUsers(response, ensureDatabase) {
  try {
    await ensureDatabase();
    const result = await query(
      `
        SELECT id, ci, registro, nombre, apellido, correo, rol, estado, id_rostro_externo, creado_en
        FROM usuarios
        ORDER BY creado_en DESC
        LIMIT 50
      `
    );

    sendJson(response, 200, {
      success: true,
      users: result.rows.map(serializeUser),
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudieron listar los usuarios.",
      message: error.message,
    });
  }
}

async function handleGetUserProfile(requestUrl, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const registro = cleanValue(requestUrl.searchParams.get("registro"));

    if (!registro) {
      sendJson(response, 400, {
        success: false,
        error: "Debes enviar el número de registro a consultar.",
      });
      return;
    }

    const user = await findUserByRegistro(registro);
    if (!user) {
      sendJson(response, 404, {
        success: false,
        error: "No se encontró un usuario con ese número de registro.",
      });
      return;
    }

    sendJson(response, 200, {
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo consultar el perfil del usuario.",
      message: error.message,
    });
  }
}

async function handleBulkSaveUsers(request, response, ensureDatabase) {
  try {
    const allowed = await authorizeAdministrativeAccess(request, response, ensureDatabase);
    if (!allowed) {
      return;
    }

    const payload = await readJsonBody(request);
    const users = Array.isArray(payload.users) ? payload.users : [];

    if (!users.length) {
      sendJson(response, 400, {
        success: false,
        error: "No hay filas importadas para guardar en base de datos.",
      });
      return;
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

        if (!userId) {
          persistedRows.push({
            action: persistedUser.action,
            horario: null,
            materia: null,
            reason: persistedUser.reason,
            user: persistedUser.user,
          });
          continue;
        }

        const materia = await upsertMateria(client, {
          docenteId: userId,
          grupo: cleanValue(importedUser.grupo),
          nombreMateria: cleanValue(importedUser.materia),
          sigla: cleanValue(importedUser.sigla),
        });

        const horario = await upsertHorario(client, {
          jueves: cleanValue(importedUser.jueves),
          lunes: cleanValue(importedUser.lunes),
          materiaId: materia.id,
          martes: cleanValue(importedUser.martes),
          miercoles: cleanValue(importedUser.miercoles),
          sabado: cleanValue(importedUser.sabado),
          viernes: cleanValue(importedUser.viernes),
        });

        persistedRows.push({
          action: persistedUser.action,
          horario,
          materia,
          reason: persistedUser.reason,
          user: persistedUser.user,
        });
      }

      return persistedRows;
    });

    sendJson(response, 200, {
      success: true,
      message: "Usuarios, materias y horarios fueron importados en PostgreSQL.",
      created: results.filter((item) => item.action === "created").length,
      updated: results.filter((item) => item.action === "updated").length,
      skipped: results.filter((item) => item.action === "skipped").length,
      users: results.map((item) => item.user),
      materias: results.map((item) => item.materia).filter(Boolean),
      horarios: results.map((item) => item.horario).filter(Boolean),
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudieron guardar los usuarios importados con sus materias y horarios.",
      message: error.message,
    });
  }
}

async function handleUpdateUserPassword(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const payload = await readJsonBody(request);
    const validation = validatePasswordUpdatePayload(payload);

    if (validation.error) {
      sendJson(response, 400, {
        success: false,
        error: validation.error,
      });
      return;
    }

    const { update } = validation;
    if (update.registro === SYSTEM_ADMIN.registro) {
      sendJson(response, 403, {
        success: false,
        error: "La contraseña del administrador del sistema no se puede modificar.",
      });
      return;
    }

    const passwordHash = hashPassword(update.password);
    const result = await query(
      `
        UPDATE usuarios
        SET
          hash_contrasena = $1,
          estado = 'Activo',
          actualizado_en = NOW()
        WHERE registro = $2
        RETURNING id, ci, registro, nombre, apellido, correo, rol, estado, id_rostro_externo, creado_en
      `,
      [passwordHash, update.registro]
    );

    if (!result.rows[0]) {
      sendJson(response, 404, {
        success: false,
        error: "No se encontró un usuario con ese número de registro.",
      });
      return;
    }

    sendJson(response, 200, {
      success: true,
      message: "La contraseña fue actualizada y el usuario quedó Activo.",
      user: serializeUser(result.rows[0]),
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudo actualizar la contraseña del usuario.",
      message: error.message,
    });
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
