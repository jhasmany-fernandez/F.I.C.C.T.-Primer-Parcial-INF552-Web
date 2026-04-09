const { query } = require("./databaseModel");
const { cleanValue } = require("../utils/valueUtils");

const SYSTEM_ADMIN = {
  apellido: "Sistema",
  ci: "0",
  correo: "admin@smartaccess.local",
  estado: "Activo",
  nombre: "Administrador",
  registro: "ADMIN-SYSTEM",
  rol: "Administrador",
};

async function ensureSystemAdministrator(hashPassword) {
  const existing = await query(
    `
      SELECT id
      FROM users
      WHERE registro = $1
      LIMIT 1
    `,
    [SYSTEM_ADMIN.registro]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const passwordHash = hashPassword("123ppp---");
  const inserted = await query(
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
      RETURNING id
    `,
    [
      SYSTEM_ADMIN.ci,
      SYSTEM_ADMIN.registro,
      SYSTEM_ADMIN.nombre,
      SYSTEM_ADMIN.apellido,
      SYSTEM_ADMIN.correo,
      passwordHash,
      SYSTEM_ADMIN.rol,
      SYSTEM_ADMIN.estado,
      SYSTEM_ADMIN.registro,
    ]
  );

  return inserted.rows[0];
}

async function findUserForLogin(registro) {
  const normalizedRegistro = cleanValue(registro);
  if (!normalizedRegistro) {
    return null;
  }

  const result = await query(
    `
      SELECT
        id,
        ci,
        registro,
        nombre,
        apellido,
        correo,
        password_hash,
        rol,
        estado,
        face_external_id,
        created_at
      FROM users
      WHERE registro = $1
      LIMIT 1
    `,
    [normalizedRegistro]
  );

  return result.rows[0] || null;
}

async function findExistingUsersByRegistro(registros) {
  const uniqueRegistros = [...new Set((registros || []).map(cleanValue).filter(Boolean))];
  if (!uniqueRegistros.length) {
    return new Map();
  }

  const result = await query(
    `
      SELECT
        id,
        registro,
        password_hash,
        estado
      FROM users
      WHERE registro = ANY($1::text[])
    `,
    [uniqueRegistros]
  );

  return result.rows.reduce((map, row) => {
    map.set(row.registro, row);
    return map;
  }, new Map());
}

async function upsertImportedUser(importedUser, buildImportedUserPayload, hashPassword, db = { query }) {
  const validation = buildImportedUserPayload(importedUser);

  if (validation.error) {
    return {
      action: "skipped",
      reason: validation.error,
      user: {
        ...importedUser,
      },
    };
  }

  const { user } = validation;
  const existingResult = await db.query(
    `
      SELECT
        id,
        ci,
        registro,
        nombre,
        apellido,
        correo,
        password_hash,
        rol,
        estado,
        face_external_id,
        created_at
      FROM users
      WHERE registro = $1
      LIMIT 1
    `,
    [user.registro]
  );
  const existing = existingResult.rows[0] || null;

  if (existing) {
    const updated = await db.query(
      `
        UPDATE users
        SET
          nombre = $1,
          apellido = $2,
          correo = $3,
          rol = $4,
          face_external_id = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING id, ci, registro, nombre, apellido, correo, rol, estado, face_external_id, created_at
      `,
      [
        user.nombre,
        user.apellido,
        user.correo,
        user.rol,
        user.faceExternalId,
        existing.id,
      ]
    );

    return {
      action: "updated",
      reason: "El usuario ya existía y fue reutilizado para relacionar materias y horarios.",
      user: updated.rows[0],
    };
  }

  const passwordHash = hashPassword(user.password);
  const inserted = await db.query(
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
      user.faceExternalId,
    ]
  );

  return {
    action: "created",
    reason: null,
    user: inserted.rows[0],
  };
}

module.exports = {
  SYSTEM_ADMIN,
  ensureSystemAdministrator,
  findExistingUsersByRegistro,
  findUserForLogin,
  upsertImportedUser,
};
