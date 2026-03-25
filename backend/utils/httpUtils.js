function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 10 * 1024 * 1024) {
        reject(new Error("El cuerpo de la solicitud excede el límite permitido."));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(new Error("JSON inválido."));
      }
    });

    request.on("error", () => {
      reject(new Error("No se pudo leer la solicitud."));
    });
  });
}

module.exports = {
  readJsonBody,
};
