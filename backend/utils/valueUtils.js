function cleanValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return cleanValue(value).toLowerCase();
}

function normalizeHeader(value) {
  return cleanValue(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

module.exports = {
  cleanValue,
  normalizeEmail,
  normalizeHeader,
};
