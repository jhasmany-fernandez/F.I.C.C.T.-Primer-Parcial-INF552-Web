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
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      ci VARCHAR(64) UNIQUE NOT NULL,
      registro VARCHAR(64) UNIQUE NOT NULL,
      nombre VARCHAR(120) NOT NULL,
      apellido VARCHAR(120) NOT NULL,
      correo VARCHAR(180) UNIQUE NOT NULL,
      password_hash TEXT,
      rol VARCHAR(80) NOT NULL DEFAULT 'Sin asignar',
      estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
      face_external_id VARCHAR(64) UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS materias (
      id SERIAL PRIMARY KEY,
      sigla VARCHAR(20) NOT NULL,
      grupo VARCHAR(20) NOT NULL,
      nombre_materia VARCHAR(180) NOT NULL,
      docente_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (sigla, grupo, docente_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS horarios (
      id SERIAL PRIMARY KEY,
      materia_id INTEGER NOT NULL UNIQUE REFERENCES materias(id) ON DELETE CASCADE,
      lunes VARCHAR(40),
      martes VARCHAR(40),
      miercoles VARCHAR(40),
      jueves VARCHAR(40),
      viernes VARCHAR(40),
      sabado VARCHAR(40),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id BIGSERIAL PRIMARY KEY,
      identifier VARCHAR(64),
      matched_face_id VARCHAR(64),
      reason TEXT NOT NULL,
      similarity NUMERIC(5,4),
      success BOOLEAN NOT NULL DEFAULT FALSE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS reports (
      id BIGSERIAL PRIMARY KEY,
      reporter_registro VARCHAR(64) NOT NULL,
      reporter_nombre VARCHAR(180),
      problem_type VARCHAR(120) NOT NULL,
      problem_state VARCHAR(120) NOT NULL,
      priority VARCHAR(60) NOT NULL,
      description TEXT NOT NULL,
      evidence_image_base64 TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS biometric_access_state (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      active BOOLEAN NOT NULL DEFAULT FALSE,
      method VARCHAR(20) NOT NULL DEFAULT 'fingerprint',
      source VARCHAR(40) NOT NULL DEFAULT 'mobile-app',
      authorized_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS mobile_session_state (
      session_key VARCHAR(128) PRIMARY KEY,
      user_id VARCHAR(64),
      registro VARCHAR(64),
      device_id VARCHAR(128),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      source VARCHAR(40) NOT NULL DEFAULT 'mobile-app',
      logout_reason VARCHAR(120),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_access_logs_created_at
    ON access_logs (created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_access_logs_identifier
    ON access_logs (identifier)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_reports_created_at
    ON reports (created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_mobile_session_registro
    ON mobile_session_state (registro)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_materias_docente_id
    ON materias (docente_id)
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
