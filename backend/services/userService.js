const crypto = require("crypto");
const {
  cleanValue,
  normalizeEmail,
  normalizeHeader,
} = require("../utils/valueUtils");

const TEMPORARY_PASSWORD = "123ppp---";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, passwordHash) {
  if (typeof password !== "string" || typeof passwordHash !== "string" || !passwordHash.includes(":")) {
    return false;
  }

  const [salt, storedDerivedKey] = passwordHash.split(":");
  if (!salt || !storedDerivedKey) {
    return false;
  }

  const derivedKeyBuffer = crypto.scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedDerivedKey, "hex");

  if (derivedKeyBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKeyBuffer, storedBuffer);
}

function isTemporaryPassword(password) {
  return password === TEMPORARY_PASSWORD;
}

function inferRoleFromSheetName(sheetName) {
  const normalizedSheetName = normalizeHeader(sheetName);

  if (normalizedSheetName.includes("estudiante")) {
    return "Estudiante";
  }

  if (normalizedSheetName.includes("docente")) {
    return "Docente";
  }

  return "Sin asignar";
}

function mapExcelUserRows(rows, sheetName) {
  const headerCandidates = {
    apellido: ["apellido", "apellidos"],
    correo: ["correo", "correo institucional", "correo electronico", "email"],
    nombre: ["nombre", "nombres"],
    registro: ["numero de registro", "nro de registro", "registro", "numero registro"],
  };
  const inferredRole = inferRoleFromSheetName(sheetName);

  return rows
    .map((row) => {
      const normalizedEntries = Object.entries(row).reduce((accumulator, [key, value]) => {
        accumulator[normalizeHeader(key)] = cleanValue(String(value ?? ""));
        return accumulator;
      }, {});

      const mapped = {};
      for (const [field, candidates] of Object.entries(headerCandidates)) {
        mapped[field] = "";
        for (const candidate of candidates) {
          if (normalizedEntries[candidate]) {
            mapped[field] = normalizedEntries[candidate];
            break;
          }
        }
      }

      return {
        ...mapped,
        rol: inferredRole,
      };
    })
    .filter((row) => row.nombre || row.apellido || row.registro || row.correo);
}

function validateUserPayload(payload) {
  const user = {
    apellido: cleanValue(payload.apellido),
    ci: cleanValue(payload.ci),
    correo: normalizeEmail(payload.correo),
    estado: cleanValue(payload.estado) || "Activo",
    nombre: cleanValue(payload.nombre),
    password: TEMPORARY_PASSWORD,
    registro: cleanValue(payload.registro),
    rol: cleanValue(payload.rol),
  };

  if (!user.ci || !user.registro || !user.nombre || !user.apellido || !user.correo || !user.rol) {
    return { error: "Todos los campos obligatorios deben completarse." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.correo)) {
    return { error: "El correo institucional no es válido." };
  }

  if (!["Activo", "Inactivo", "Pendiente"].includes(user.estado)) {
    return { error: "El estado indicado no es válido." };
  }

  user.estado = "Pendiente";

  return { user };
}

function validatePasswordUpdatePayload(payload) {
  const registro = cleanValue(payload.registro);
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!registro || !password) {
    return { error: "El número de registro y la nueva contraseña son obligatorios." };
  }

  if (password.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  }

  return {
    update: {
      password,
      registro,
    },
  };
}

function buildImportedUserPayload(payload) {
  const registro = cleanValue(payload.registro);
  const correo = normalizeEmail(payload.correo);
  const nombre = cleanValue(payload.nombre);
  const apellido = cleanValue(payload.apellido);
  const rol = cleanValue(payload.rol) || "Sin asignar";
  const estado = cleanValue(payload.estado) || "Pendiente";
  const ci = cleanValue(payload.ci) || `AUTO-${registro}`;

  if (!registro || !correo || !nombre || !apellido) {
    return { error: "Cada fila importada debe tener nombre, apellido, registro y correo." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { error: `El correo ${correo} no es válido.` };
  }

  return {
    user: {
      apellido,
      ci,
      correo,
      estado: ["Activo", "Inactivo", "Pendiente"].includes(estado) ? estado : "Pendiente",
      faceExternalId: registro,
      nombre,
      password: TEMPORARY_PASSWORD,
      registro,
      rol,
    },
  };
}

module.exports = {
  buildImportedUserPayload,
  hashPassword,
  isTemporaryPassword,
  mapExcelUserRows,
  TEMPORARY_PASSWORD,
  verifyPassword,
  validatePasswordUpdatePayload,
  validateUserPayload,
};
