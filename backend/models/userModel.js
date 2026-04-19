// MVC Model: estos helpers solo conocen persistencia sobre `usuarios`.
// No manejan HTTP ni decisiones de interfaz; exponen operaciones de lectura
// y escritura para que los servicios compongan los casos de uso.
const { query } = require("./databaseModel");
const { cleanValue } = require("../utils/valueUtils");

// Administrador semilla usado cuando la tabla está vacía por completo.
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
  const existingAdministrator = await query(
    `
      SELECT id
      FROM usuarios
      WHERE rol = 'Administrador'
      ORDER BY id ASC
      LIMIT 1
    `
  );

  if (existingAdministrator.rows[0]) {
    return existingAdministrator.rows[0];
  }

  const existing = await query(
    `
      SELECT id
      FROM usuarios
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

// Mantiene alineado el primer acceso de docentes pendientes con la clave genérica del sistema.
async function ensurePendingTeachersGenericPassword(hashPassword, verifyPassword, temporaryPassword) {
  const result = await query(
    `
      SELECT id, hash_contrasena
      FROM usuarios
      WHERE rol = 'Docente' AND estado = 'Pendiente'
    `
  );

  let updatedCount = 0;

  for (const row of result.rows) {
    if (verifyPassword(temporaryPassword, row.hash_contrasena)) {
      continue;
    }

    await query(
      `
        UPDATE usuarios
        SET
          hash_contrasena = $1,
          actualizado_en = NOW()
        WHERE id = $2
      `,
      [hashPassword(temporaryPassword), row.id]
    );
    updatedCount += 1;
  }

  return updatedCount;
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
        hash_contrasena,
        rol,
        estado,
        id_rostro_externo,
        creado_en
      FROM usuarios
      WHERE registro = $1
      LIMIT 1
    `,
    [normalizedRegistro]
  );

  return result.rows[0] || null;
}

async function findUserByRegistro(registro) {
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
        rol,
        estado,
        id_rostro_externo,
        creado_en
      FROM usuarios
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
        hash_contrasena,
        estado
      FROM usuarios
      WHERE registro = ANY($1::text[])
    `,
    [uniqueRegistros]
  );

  return result.rows.reduce((map, row) => {
    map.set(row.registro, row);
    return map;
  }, new Map());
}

// Las consultas reutilizables aceptan un cliente opcional para participar en transacciones del service.
async function listRecentUsers(limit = 50, db = { query }) {
  const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 50;
  const result = await db.query(
    `
      SELECT id, ci, registro, nombre, apellido, correo, rol, estado, id_rostro_externo, creado_en
      FROM usuarios
      ORDER BY creado_en DESC
      LIMIT $1
    `,
    [normalizedLimit]
  );

  return result.rows;
}

async function createUserRecord(user, passwordHash, db = { query }) {
  const result = await db.query(
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

  return result.rows[0] || null;
}

// Al actualizar contraseña se activa el usuario porque ya completó el primer ingreso obligatorio.
async function updateUserPasswordByRegistro(registro, passwordHash, db = { query }) {
  const normalizedRegistro = cleanValue(registro);
  if (!normalizedRegistro) {
    return null;
  }

  const result = await db.query(
    `
      UPDATE usuarios
      SET
        hash_contrasena = $1,
        estado = 'Activo',
        actualizado_en = NOW()
      WHERE registro = $2
      RETURNING id, ci, registro, nombre, apellido, correo, rol, estado, id_rostro_externo, creado_en
    `,
    [passwordHash, normalizedRegistro]
  );

  return result.rows[0] || null;
}

// En carga masiva se reutiliza el registro existente para no duplicar docentes y preservar relaciones.
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
        hash_contrasena,
        rol,
        estado,
        id_rostro_externo,
        creado_en
      FROM usuarios
      WHERE registro = $1
      LIMIT 1
    `,
    [user.registro]
  );
  const existing = existingResult.rows[0] || null;

  if (existing) {
    const updated = await db.query(
      `
        UPDATE usuarios
        SET
          nombre = $1,
          apellido = $2,
          correo = $3,
          rol = $4,
          id_rostro_externo = $5,
          actualizado_en = NOW()
        WHERE id = $6
        RETURNING id, ci, registro, nombre, apellido, correo, rol, estado, id_rostro_externo, creado_en
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
  createUserRecord,
  ensurePendingTeachersGenericPassword,
  SYSTEM_ADMIN,
  ensureSystemAdministrator,
  findExistingUsersByRegistro,
  findUserByRegistro,
  findUserForLogin,
  listRecentUsers,
  updateUserPasswordByRegistro,
  upsertImportedUser,
};
