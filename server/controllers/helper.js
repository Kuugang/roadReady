const { getDocs, query } = require("firebase/firestore/lite")


function validateRequiredFields(fields, body, res) {
    for (const field of fields) {
        if (!body[field] || body[field].trim().length === 0) {
            return res.status(400).json({ message: `${field} is required` });
        }
    }
    return null;
}

async function queryDatabase(collectionRef, condition, errorMessage) {
    try {
        const querySnapshot = await getDocs(query(collectionRef, condition));
        if (querySnapshot.empty) {
            return { error: errorMessage };
        }

        const data = querySnapshot.docs.map(doc => {
            const id = doc.id;
            const documentData = doc.data();

            const { password, ...filteredData } = documentData;

            return { id, ...filteredData };
        });
        return data;
    } catch (error) {
        console.error("Error querying Firestore collection:", error);
        return { error: "Internal server error" };
    }
}

module.exports = {
    validateRequiredFields,
    queryDatabase,
}