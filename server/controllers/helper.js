function validateRequiredFields(fields, body, res) {
    for (const field of fields) {
        if (!body[field] || body[field].trim().length === 0) {
            return res.status(400).json({ message: `${field} is required` });
        }
    }
    return null;
}


module.exports = {
    validateRequiredFields
}