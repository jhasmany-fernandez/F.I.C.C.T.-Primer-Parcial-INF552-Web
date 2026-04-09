async function upsertMateria(client, materia) {
  const existing = await client.query(
    `
      SELECT id
      FROM materias
      WHERE sigla = $1 AND grupo = $2 AND docente_id = $3
      LIMIT 1
    `,
    [materia.sigla, materia.grupo, materia.docenteId]
  );

  if (existing.rows[0]) {
    const updated = await client.query(
      `
        UPDATE materias
        SET
          nombre_materia = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, sigla, grupo, nombre_materia, docente_id, created_at, updated_at
      `,
      [materia.nombreMateria, existing.rows[0].id]
    );

    return updated.rows[0];
  }

  const inserted = await client.query(
    `
      INSERT INTO materias (
        sigla,
        grupo,
        nombre_materia,
        docente_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, sigla, grupo, nombre_materia, docente_id, created_at, updated_at
    `,
    [materia.sigla, materia.grupo, materia.nombreMateria, materia.docenteId]
  );

  return inserted.rows[0];
}

async function upsertHorario(client, horario) {
  const existing = await client.query(
    `
      SELECT id
      FROM horarios
      WHERE materia_id = $1
      LIMIT 1
    `,
    [horario.materiaId]
  );

  const values = [
    horario.lunes,
    horario.martes,
    horario.miercoles,
    horario.jueves,
    horario.viernes,
    horario.sabado,
    horario.materiaId,
  ];

  if (existing.rows[0]) {
    const updated = await client.query(
      `
        UPDATE horarios
        SET
          lunes = $1,
          martes = $2,
          miercoles = $3,
          jueves = $4,
          viernes = $5,
          sabado = $6,
          updated_at = NOW()
        WHERE materia_id = $7
        RETURNING id, materia_id, lunes, martes, miercoles, jueves, viernes, sabado, created_at, updated_at
      `,
      values
    );

    return updated.rows[0];
  }

  const inserted = await client.query(
    `
      INSERT INTO horarios (
        lunes,
        martes,
        miercoles,
        jueves,
        viernes,
        sabado,
        materia_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, materia_id, lunes, martes, miercoles, jueves, viernes, sabado, created_at, updated_at
    `,
    values
  );

  return inserted.rows[0];
}

module.exports = {
  upsertHorario,
  upsertMateria,
};
