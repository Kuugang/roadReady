function validateRequiredFields(fields, body) {
    for (const field of fields) {
        if (!body[field] || body[field].trim().length === 0) {
            return { "message": `${field} is required` };
        }
    }
    return null;
}


module.exports = {
    validateRequiredFields
}