const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const {
  query,
} = require("../models/databaseModel");
const {
  SYSTEM_ADMIN,
  findExistingUsersByRegistro,
  upsertImportedUser,
} = require("../models/userModel");
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
        INSERT INTO users (
          ci,
          registro,
          nombre,
          apellido,
          correo,
          password_hash,
          rol,
          estado,
          face_external_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, ci, registro, nombre, apellido, correo, rol, estado, face_external_id, created_at
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
        const hasPasswordAssigned = Boolean(existingUser?.password_hash);

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
        SELECT id, ci, registro, nombre, apellido, correo, rol, estado, face_external_id, created_at
        FROM users
        ORDER BY created_at DESC
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

async function handleBulkSaveUsers(request, response, ensureDatabase) {
  try {
    await ensureDatabase();
    const payload = await readJsonBody(request);
    const users = Array.isArray(payload.users) ? payload.users : [];

    if (!users.length) {
      sendJson(response, 400, {
        success: false,
        error: "No hay filas importadas para guardar en base de datos.",
      });
      return;
    }

    const results = [];
    for (const importedUser of users) {
      results.push(await upsertImportedUser(importedUser, buildImportedUserPayload, hashPassword));
    }

    sendJson(response, 200, {
      success: true,
      message: "Usuarios importados guardados en PostgreSQL.",
      created: results.filter((item) => item.action === "created").length,
      skipped: results.filter((item) => item.action === "skipped").length,
      users: results.map((item) => item.user),
    });
  } catch (error) {
    sendJson(response, 500, {
      success: false,
      error: "No se pudieron guardar los usuarios importados.",
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
        UPDATE users
        SET
          password_hash = $1,
          estado = 'Activo',
          updated_at = NOW()
        WHERE registro = $2
        RETURNING id, ci, registro, nombre, apellido, correo, rol, estado, face_external_id, created_at
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
  handleImportUsersExcel,
  handleListUsers,
  handleUpdateUserPassword,
};
