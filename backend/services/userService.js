const crypto = require("crypto");
const {
  cleanValue,
  normalizeEmail,
  normalizeHeader,
} = require("../utils/valueUtils");

const TEMPORARY_PASSWORD = "ficct123*";
const SCHEDULE_DAY_FIELDS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

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

function usesPendingTeacherPassword(user = {}) {
  return cleanValue(user.rol) === "Docente" && (cleanValue(user.estado) || "Pendiente") === "Pendiente";
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

function splitFullName(fullName) {
  const normalized = cleanValue(fullName);
  if (!normalized) {
    return {
      apellido: "",
      nombre: "",
    };
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return {
      apellido: parts[0],
      nombre: parts[0],
    };
  }

  if (parts.length === 2) {
    return {
      apellido: parts[0],
      nombre: parts[1],
    };
  }

  const splitIndex = Math.ceil(parts.length / 2);
  return {
    apellido: parts.slice(0, splitIndex).join(" "),
    nombre: parts.slice(splitIndex).join(" "),
  };
}

function mapExcelUserRows(rows, sheetName) {
  const headerCandidates = {
    docente: ["docente"],
    grupo: ["gr"],
    lunes: ["lunes"],
    martes: ["martes"],
    materia: ["materia"],
    miercoles: ["miercoles"],
    jueves: ["jueves"],
    viernes: ["viernes"],
    sabado: ["sabado"],
    sigla: ["sigla"],
    apellido: ["apellido", "apellidos"],
    correo: ["correo", "correo institucional", "correo electronico", "email"],
    nombre: ["nombre", "nombres"],
    registro: ["numero de registro", "nro de registro", "registro", "numero registro"],
    rol: ["rol", "perfil", "cargo"],
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

      if ((!mapped.nombre || !mapped.apellido) && mapped.docente) {
        const parsedName = splitFullName(mapped.docente);
        mapped.nombre = mapped.nombre || parsedName.nombre;
        mapped.apellido = mapped.apellido || parsedName.apellido;
      }

      return {
        ...mapped,
        docente: mapped.docente || [mapped.apellido, mapped.nombre].filter(Boolean).join(" "),
        rol: mapped.rol || inferredRole,
      };
    })
    .filter((row) => row.nombre || row.apellido || row.registro || row.correo || row.sigla || row.materia);
}

function buildImportedAcademicPayload(payload) {
  const academic = {
    grupo: cleanValue(payload.grupo),
    materia: cleanValue(payload.materia),
    sigla: cleanValue(payload.sigla),
  };

  for (const field of SCHEDULE_DAY_FIELDS) {
    academic[field] = cleanValue(payload[field]);
  }

  const hasCoreAcademicInfo = Boolean(academic.sigla || academic.grupo || academic.materia);
  const hasSchedule = SCHEDULE_DAY_FIELDS.some((field) => academic[field]);
  const hasAnyAcademicInfo = hasCoreAcademicInfo || hasSchedule;

  if (!hasAnyAcademicInfo) {
    return {
      academic: null,
      warning: null,
    };
  }

  if (!academic.sigla || !academic.grupo || !academic.materia) {
    return {
      academic: null,
      warning: "La fila académica debe incluir sigla, grupo y materia para guardarse.",
    };
  }

  return {
    academic: {
      ...academic,
      hasSchedule,
    },
    warning: hasSchedule
      ? null
      : "La fila académica no tiene horarios cargados; se omitirá la tabla horarios.",
  };
}

function validateUserPayload(payload) {
  const user = {
    apellido: cleanValue(payload.apellido),
    ci: cleanValue(payload.ci),
    correo: normalizeEmail(payload.correo),
    estado: cleanValue(payload.estado) || "Pendiente",
    nombre: cleanValue(payload.nombre),
    registro: cleanValue(payload.registro),
    rol: cleanValue(payload.rol),
  };
  const providedPassword = typeof payload.password === "string" ? payload.password.trim() : "";

  if (!user.ci || !user.registro || !user.nombre || !user.apellido || !user.correo || !user.rol) {
    return { error: "Todos los campos obligatorios deben completarse." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.correo)) {
    return { error: "El correo institucional no es válido." };
  }

  if (!["Activo", "Inactivo", "Pendiente"].includes(user.estado)) {
    return { error: "El estado indicado no es válido." };
  }

  if (usesPendingTeacherPassword(user)) {
    user.password = TEMPORARY_PASSWORD;
    return { user };
  }

  if (!providedPassword) {
    return { error: "Debes asignar una contraseña inicial para este usuario." };
  }

  user.password = providedPassword;

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
      password: usesPendingTeacherPassword({ rol, estado }) ? TEMPORARY_PASSWORD : (cleanValue(payload.password) || TEMPORARY_PASSWORD),
      registro,
      rol,
    },
  };
}

module.exports = {
  buildImportedAcademicPayload,
  buildImportedUserPayload,
  hashPassword,
  isTemporaryPassword,
  mapExcelUserRows,
  splitFullName,
  TEMPORARY_PASSWORD,
  usesPendingTeacherPassword,
  verifyPassword,
  validatePasswordUpdatePayload,
  validateUserPayload,
};
