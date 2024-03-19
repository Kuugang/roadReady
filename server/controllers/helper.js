function validateRequiredFields(fields, body) {
  for (const field of fields) {
    if (!body[field] || body[field].trim().length === 0) {
      return `${field} is required`;
    }
  }
  return null; // All required fields are present and not empty
}


module.exports = {
    validateRequiredFields
}