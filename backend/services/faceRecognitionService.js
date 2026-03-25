async function proxyFaceLogin(payload, faceServiceUrl) {
  const response = await fetch(faceServiceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: payload.image,
      threshold: payload.threshold || 0.6,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      statusCode: response.status,
      body: {
        success: false,
        error: data.error || "No se encontró coincidencia facial.",
        message: data.message || "La validación facial falló.",
      },
    };
  }

  return {
    statusCode: 200,
    body: {
      success: true,
      userId: data.id,
      similarity: data.similarity,
      identifier: payload.identifier || null,
      message: "Reconocimiento facial exitoso desde backend Node.js.",
      source: "face-recognition-service",
    },
  };
}

module.exports = {
  proxyFaceLogin,
};
