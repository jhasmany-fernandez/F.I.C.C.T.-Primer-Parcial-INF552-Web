const fs = require("fs");
const { Pool } = require("pg");

let pool = null;
let initialized = false;

function loadEnvironment(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getPool() {
  if (!pool) {
    const host = process.env.DB_HOST || process.env.POSTGRES_HOST || "localhost";
    const port = Number(process.env.DB_PORT || 5432);
    const database = process.env.POSTGRES_DB || "smart_access";
    const user = process.env.POSTGRES_USER || "postgres";
    const password = process.env.POSTGRES_PASSWORD || "postgres";

    pool = new Pool({
      database,
      host,
      password,
      port,
      user,
    });
  }

  return pool;
}

async function query(text, params = []) {
  return getPool().query(text, params);
}

async function withTransaction(run) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function initDatabase() {
  if (initialized) {
    return;
  }

  await query(`
    DO $$
    BEGIN
      IF to_regclass('public.users') IS NOT NULL AND to_regclass('public.usuarios') IS NULL THEN
        ALTER TABLE users RENAME TO usuarios;
      END IF;
      IF to_regclass('public.access_logs') IS NOT NULL AND to_regclass('public.bitacora_accesos') IS NULL THEN
        ALTER TABLE access_logs RENAME TO bitacora_accesos;
      END IF;
      IF to_regclass('public.reports') IS NOT NULL AND to_regclass('public.reportes') IS NULL THEN
        ALTER TABLE reports RENAME TO reportes;
      END IF;
      IF to_regclass('public.biometric_access_state') IS NOT NULL AND to_regclass('public.estado_acceso_biometrico') IS NULL THEN
        ALTER TABLE biometric_access_state RENAME TO estado_acceso_biometrico;
      END IF;
      IF to_regclass('public.mobile_session_state') IS NOT NULL AND to_regclass('public.estado_sesion_movil') IS NULL THEN
        ALTER TABLE mobile_session_state RENAME TO estado_sesion_movil;
      END IF;
      IF to_regclass('public.installations_smart_lock_state') IS NOT NULL AND to_regclass('public.estado_chapas_inteligentes') IS NULL THEN
        ALTER TABLE installations_smart_lock_state RENAME TO estado_chapas_inteligentes;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'password_hash') THEN
        ALTER TABLE usuarios RENAME COLUMN password_hash TO hash_contrasena;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'face_external_id') THEN
        ALTER TABLE usuarios RENAME COLUMN face_external_id TO id_rostro_externo;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'created_at') THEN
        ALTER TABLE usuarios RENAME COLUMN created_at TO creado_en;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'updated_at') THEN
        ALTER TABLE usuarios RENAME COLUMN updated_at TO actualizado_en;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'materias' AND column_name = 'docente_id') THEN
        ALTER TABLE materias RENAME COLUMN docente_id TO id_docente;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'materias' AND column_name = 'created_at') THEN
        ALTER TABLE materias RENAME COLUMN created_at TO creado_en;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'materias' AND column_name = 'updated_at') THEN
        ALTER TABLE materias RENAME COLUMN updated_at TO actualizado_en;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'horarios' AND column_name = 'materia_id') THEN
        ALTER TABLE horarios RENAME COLUMN materia_id TO id_materia;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'horarios' AND column_name = 'created_at') THEN
        ALTER TABLE horarios RENAME COLUMN created_at TO creado_en;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'horarios' AND column_name = 'updated_at') THEN
        ALTER TABLE horarios RENAME COLUMN updated_at TO actualizado_en;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bitacora_accesos' AND column_name = 'identifier') THEN
        ALTER TABLE bitacora_accesos RENAME COLUMN identifier TO identificador;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bitacora_accesos' AND column_name = 'matched_face_id') THEN
        ALTER TABLE bitacora_accesos RENAME COLUMN matched_face_id TO id_rostro_coincidente;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bitacora_accesos' AND column_name = 'reason') THEN
        ALTER TABLE bitacora_accesos RENAME COLUMN reason TO motivo;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bitacora_accesos' AND column_name = 'similarity') THEN
        ALTER TABLE bitacora_accesos RENAME COLUMN similarity TO similitud;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bitacora_accesos' AND column_name = 'success') THEN
        ALTER TABLE bitacora_accesos RENAME COLUMN success TO exito;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bitacora_accesos' AND column_name = 'user_id') THEN
        ALTER TABLE bitacora_accesos RENAME COLUMN user_id TO id_usuario;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bitacora_accesos' AND column_name = 'created_at') THEN
        ALTER TABLE bitacora_accesos RENAME COLUMN created_at TO creado_en;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reportes' AND column_name = 'reporter_registro') THEN
        ALTER TABLE reportes RENAME COLUMN reporter_registro TO registro_reportante;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reportes' AND column_name = 'reporter_nombre') THEN
        ALTER TABLE reportes RENAME COLUMN reporter_nombre TO nombre_reportante;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reportes' AND column_name = 'problem_type') THEN
        ALTER TABLE reportes RENAME COLUMN problem_type TO tipo_problema;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reportes' AND column_name = 'problem_state') THEN
        ALTER TABLE reportes RENAME COLUMN problem_state TO estado_problema;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reportes' AND column_name = 'priority') THEN
        ALTER TABLE reportes RENAME COLUMN priority TO prioridad;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reportes' AND column_name = 'description') THEN
        ALTER TABLE reportes RENAME COLUMN description TO descripcion;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reportes' AND column_name = 'evidence_image_base64') THEN
        ALTER TABLE reportes RENAME COLUMN evidence_image_base64 TO imagen_evidencia_base64;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reportes' AND column_name = 'created_at') THEN
        ALTER TABLE reportes RENAME COLUMN created_at TO creado_en;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_acceso_biometrico' AND column_name = 'active') THEN
        ALTER TABLE estado_acceso_biometrico RENAME COLUMN active TO activo;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_acceso_biometrico' AND column_name = 'method') THEN
        ALTER TABLE estado_acceso_biometrico RENAME COLUMN method TO metodo;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_acceso_biometrico' AND column_name = 'source') THEN
        ALTER TABLE estado_acceso_biometrico RENAME COLUMN source TO origen;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_acceso_biometrico' AND column_name = 'authorized_at') THEN
        ALTER TABLE estado_acceso_biometrico RENAME COLUMN authorized_at TO autorizado_en;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_acceso_biometrico' AND column_name = 'expires_at') THEN
        ALTER TABLE estado_acceso_biometrico RENAME COLUMN expires_at TO expira_en;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_acceso_biometrico' AND column_name = 'updated_at') THEN
        ALTER TABLE estado_acceso_biometrico RENAME COLUMN updated_at TO actualizado_en;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_sesion_movil' AND column_name = 'session_key') THEN
        ALTER TABLE estado_sesion_movil RENAME COLUMN session_key TO clave_sesion;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_sesion_movil' AND column_name = 'user_id') THEN
        ALTER TABLE estado_sesion_movil RENAME COLUMN user_id TO usuario_id;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_sesion_movil' AND column_name = 'device_id') THEN
        ALTER TABLE estado_sesion_movil RENAME COLUMN device_id TO id_dispositivo;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_sesion_movil' AND column_name = 'active') THEN
        ALTER TABLE estado_sesion_movil RENAME COLUMN active TO activo;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_sesion_movil' AND column_name = 'source') THEN
        ALTER TABLE estado_sesion_movil RENAME COLUMN source TO origen;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_sesion_movil' AND column_name = 'logout_reason') THEN
        ALTER TABLE estado_sesion_movil RENAME COLUMN logout_reason TO motivo_cierre_sesion;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_sesion_movil' AND column_name = 'created_at') THEN
        ALTER TABLE estado_sesion_movil RENAME COLUMN created_at TO creado_en;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_sesion_movil' AND column_name = 'updated_at') THEN
        ALTER TABLE estado_sesion_movil RENAME COLUMN updated_at TO actualizado_en;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_chapas_inteligentes' AND column_name = 'module_name') THEN
        ALTER TABLE estado_chapas_inteligentes RENAME COLUMN module_name TO nombre_modulo;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_chapas_inteligentes' AND column_name = 'action') THEN
        ALTER TABLE estado_chapas_inteligentes RENAME COLUMN action TO accion;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_chapas_inteligentes' AND column_name = 'auth_method') THEN
        ALTER TABLE estado_chapas_inteligentes RENAME COLUMN auth_method TO metodo_autenticacion;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_chapas_inteligentes' AND column_name = 'operator_registration') THEN
        ALTER TABLE estado_chapas_inteligentes RENAME COLUMN operator_registration TO registro_operador;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_chapas_inteligentes' AND column_name = 'operator_name') THEN
        ALTER TABLE estado_chapas_inteligentes RENAME COLUMN operator_name TO nombre_operador;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_chapas_inteligentes' AND column_name = 'smart_locks_power_enabled') THEN
        ALTER TABLE estado_chapas_inteligentes RENAME COLUMN smart_locks_power_enabled TO chapas_encendidas;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_chapas_inteligentes' AND column_name = 'intelligent_mode_enabled') THEN
        ALTER TABLE estado_chapas_inteligentes RENAME COLUMN intelligent_mode_enabled TO modo_inteligente_habilitado;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estado_chapas_inteligentes' AND column_name = 'updated_at') THEN
        ALTER TABLE estado_chapas_inteligentes RENAME COLUMN updated_at TO actualizado_en;
      END IF;
    END
    $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      ci VARCHAR(64) UNIQUE NOT NULL,
      registro VARCHAR(64) UNIQUE NOT NULL,
      nombre VARCHAR(120) NOT NULL,
      apellido VARCHAR(120) NOT NULL,
      correo VARCHAR(180) UNIQUE NOT NULL,
      hash_contrasena TEXT,
      rol VARCHAR(80) NOT NULL DEFAULT 'Sin asignar',
      estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
      id_rostro_externo VARCHAR(64) UNIQUE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS materias (
      id SERIAL PRIMARY KEY,
      sigla VARCHAR(20) NOT NULL,
      grupo VARCHAR(20) NOT NULL,
      nombre_materia VARCHAR(180) NOT NULL,
      id_docente INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (sigla, grupo, id_docente)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS horarios (
      id SERIAL PRIMARY KEY,
      id_materia INTEGER NOT NULL UNIQUE REFERENCES materias(id) ON DELETE CASCADE,
      lunes VARCHAR(40),
      martes VARCHAR(40),
      miercoles VARCHAR(40),
      jueves VARCHAR(40),
      viernes VARCHAR(40),
      sabado VARCHAR(40),
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS bitacora_accesos (
      id BIGSERIAL PRIMARY KEY,
      identificador VARCHAR(64),
      id_rostro_coincidente VARCHAR(64),
      motivo TEXT NOT NULL,
      similitud NUMERIC(5,4),
      exito BOOLEAN NOT NULL DEFAULT FALSE,
      id_usuario INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS reportes (
      id BIGSERIAL PRIMARY KEY,
      registro_reportante VARCHAR(64) NOT NULL,
      nombre_reportante VARCHAR(180),
      tipo_problema VARCHAR(120) NOT NULL,
      estado_problema VARCHAR(120) NOT NULL,
      prioridad VARCHAR(60) NOT NULL,
      descripcion TEXT NOT NULL,
      imagen_evidencia_base64 TEXT,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS estado_acceso_biometrico (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      activo BOOLEAN NOT NULL DEFAULT FALSE,
      metodo VARCHAR(20) NOT NULL DEFAULT 'fingerprint',
      origen VARCHAR(40) NOT NULL DEFAULT 'mobile-app',
      autorizado_en TIMESTAMPTZ,
      expira_en TIMESTAMPTZ,
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS estado_sesion_movil (
      clave_sesion VARCHAR(128) PRIMARY KEY,
      usuario_id VARCHAR(64),
      registro VARCHAR(64),
      id_dispositivo VARCHAR(128),
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      origen VARCHAR(40) NOT NULL DEFAULT 'mobile-app',
      motivo_cierre_sesion VARCHAR(120),
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS estado_chapas_inteligentes (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      nombre_modulo VARCHAR(180) NOT NULL DEFAULT 'Modulo Docente',
      accion VARCHAR(40) NOT NULL DEFAULT 'disable_smart_locks',
      metodo_autenticacion VARCHAR(20),
      registro_operador VARCHAR(64),
      nombre_operador VARCHAR(180),
      chapas_encendidas BOOLEAN NOT NULL DEFAULT FALSE,
      modo_inteligente_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_bitacora_accesos_created_at
    ON bitacora_accesos (creado_en DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_bitacora_accesos_identifier
    ON bitacora_accesos (identificador)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_reportes_created_at
    ON reportes (creado_en DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_estado_sesion_movil_registro
    ON estado_sesion_movil (registro)
  `);

  await query(`
    INSERT INTO estado_chapas_inteligentes (
      id,
      nombre_modulo,
      accion,
      chapas_encendidas,
      modo_inteligente_habilitado,
      actualizado_en
    )
    VALUES (1, 'Modulo Docente', 'disable_smart_locks', FALSE, FALSE, NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  await query(`
    DROP INDEX IF EXISTS idx_materias_docente_id
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_materias_id_docente
    ON materias (id_docente)
  `);

  initialized = true;
}

async function getDatabaseStatus() {
  try {
    await query("SELECT 1");
    return {
      connected: true,
      engine: "postgresql",
      host: process.env.DB_HOST || process.env.POSTGRES_HOST || "localhost",
    };
  } catch (error) {
    return {
      connected: false,
      engine: "postgresql",
      error: error.message,
    };
  }
}

module.exports = {
  getDatabaseStatus,
  getPool,
  initDatabase,
  loadEnvironment,
  query,
  withTransaction,
};
