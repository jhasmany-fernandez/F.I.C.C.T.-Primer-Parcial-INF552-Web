function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    ci: user.ci,
    registro: user.registro,
    nombre: user.nombre,
    apellido: user.apellido,
    correo: user.correo,
    rol: user.rol,
    estado: user.estado,
    faceExternalId: user.face_external_id,
    createdAt: user.created_at,
  };
}

module.exports = {
  serializeUser,
};
