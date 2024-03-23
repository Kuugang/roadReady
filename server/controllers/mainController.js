const { v4: uuidv4 } = require('uuid');
const { db } = require("../config/dbConfig");
const { supabase, pool } = require("../config/supabaseConfig")
const asyncHandler = require("express-async-handler");


const { collection, documentId, getDocs, getDoc, doc, query, where, addDoc, deleteDoc, updateDoc, queryEqual } = require("firebase/firestore/lite")


const { getStorage, ref, getDownloadURL, uploadBytesResumable } = require("firebase/storage")

const { validateRequiredFields, queryDatabase } = require("./helper")
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const storage = getStorage();

const adminCol = collection(db, 'admin');
const listingCol = collection(db, 'listing');
const buyerCol = collection(db, 'buyer');
const dealershipCol = collection(db, 'dealership');
const requestCol = collection(db, 'request');
const usersCol = collection(db, "users");



const buyerRegister = asyncHandler(async (req, res) => {
    try {

        const requiredFields = ['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'address', 'gender'];
        validateRequiredFields(requiredFields, req.body, res);

        let { email, password, firstName, lastName, phoneNumber, address, gender } = req.body;

        let { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        })

        if (error || !data) {
            return res.status(500).json(error);
        }

        const createUserProfileQuery = `
        INSERT INTO tblUserProfile (id, firstname, lastname, phonenumber, address, gender, role)
        VALUES ($1, $2, $3, $4, $5, $6, 'buyer')
        RETURNING *;
        `;

        const { rows: userProfile, error: profileError } = await pool.query(createUserProfileQuery, [data.user.id, firstName, lastName, phoneNumber, address, gender]);

        if (profileError) {
            await supabase.auth.api.deleteUser(data.user.id);
            return res.status(500).json({ error: 'Error creating user profile' });
        }

        return res.status(201).json({ message: "Successfully registered" });
    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});


const dealerRegister = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'address', 'gender', 'dealershipName'];
        validateRequiredFields(requiredFields, req.body, res);

        let { email, password, firstName, lastName, phoneNumber, address, gender, dealershipName } = req.body;

        let query = "SELECT id, name FROM tblDealership WHERE name = $1"

        const dealership = (await pool.query(query, [dealershipName])).rows[0];

        if (!dealership) {
            return res.status(400).json({ error: 'Dealership not found' });
        }

        let { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        })

        if (error || !data) {
            return res.status(500).json(error);
        }

        const createUserProfileQuery = `
            INSERT INTO tblUserProfile(id, firstname, lastname, phonenumber, address, gender, role)
            VALUES ($1, $2, $3, $4, $5, $6, 'dealershipAgent')
            RETURNING *;
        `;

        const { rows: userProfile, error: profileError } = await pool.query(createUserProfileQuery, [data.user.id, firstName, lastName, phoneNumber, address, gender]);

        const createDealershipAgent = `INSERT INTO tblDealershipAgent (userid, dealership) VALUES ($1, $2)`
        const { rows: dealershipAgent, error: dealershipAgentErorr } = await pool.query(createDealershipAgent, [data.user.id, dealership.id]);

        if (profileError || dealershipAgentErorr) {
            await supabase.auth.api.deleteUser(data.user.id);
            return res.status(500).json({ error: 'Error creating user profile' });
        }

        return res.status(201).json({ message: "Successfully registered" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }

});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    let { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })

    if (error || !data) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    let query = `SELECT * FROM tblUserProfile where id =$1`;
    const user = (await pool.query(query, [data.user.id])).rows[0];

    const token = jwt.sign(
        user,
        process.env.JWT_SECRET,
        { expiresIn: 86400 }
    );

    res.cookie('jwt', token, {
        path: '/',
        domain: '',
        sameSite: 'None',
        secure: true
    });

    user.token = token;
    return res.status(200).json(user);
});




const getUserProfile = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['userId']
        validateRequiredFields(requiredFields, req.query, res);

        const { userId } = req.query;

        let query = "SELECT * from tblUserProfile WHERE userid = $1"
        let user = (await pool.query(query, [userId])).rows[0];
        if (!user)
            return res.status(404).json({ message: "User not found" })

        const { role, ...updatedUser } = user;

        return res.status(200).json(updatedUser)
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
})

const updateUserProfile = asyncHandler(async (req, res) => {
    try {
        const updateFields = ['firstName', 'lastName', 'phoneNumber', 'address', 'gender'];
        const updates = {};

        updateFields.forEach(field => {
            if (req.body[field]) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const updateValues = Object.values(updates);
        const updatePlaceholders = Object.keys(updates).map((_, index) => `$${index + 1}`);

        const updateUserProfileQuery = `
            UPDATE tblUserProfile 
            SET ${Object.keys(updates).map((key, index) => `${key} = ${updatePlaceholders[index]}`).join(', ')}
            WHERE userid = $${Object.keys(updates).length + 1}
            RETURNING *;
        `;


        const { rows: userProfile, error: profileError } = await pool.query(updateUserProfileQuery, [...updateValues, req.tokenData.userid]);

        if (profileError) {
            await supabase.auth.update({
                id: req.user.id,
                email: req.user.email
            });
            return res.status(500).json({ error: 'Error updating user profile' });
        }

        return res.status(200).json({ message: 'User profile updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

//LISTING

const createListing = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['modelAndName', 'make', 'fuelType', 'power', 'transmission', 'engine', 'fuelTankCapacity', 'seatingCapacity', 'price', 'dealershipName', 'vehicleType'];

        validateRequiredFields(requiredFields, req.body, res);

        const { modelAndName, make, fuelType, power, transmission, engine, fuelTankCapacity, seatingCapacity, price, dealershipName, vehicleType } = req.body;

        let query = "SELECT * FROM tblDealership WHERE name = $1"
        const dealership = (await pool.query(query, [dealershipName])).rows[0];
        if (!dealership)
            return res.status(404).json({ message: "Dealership not found" });

        const { data, error } = await supabase.storage.from('listing').upload(uuidv4(), req.file.buffer, {
            contentType: req.file.mimetype
        });

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        const imageURL = `https://xjrhebmomygxcafbvlye.supabase.co/storage/v1/object/public/` + data.fullPath;
        // modelAndName VARCHAR(255) NOT NULL,
        // make VARCHAR(255) NOT NULL,
        // fuelType VARCHAR(255) NOT NULL,
        // power VARCHAR(255) NOT NULL,
        // transmission VARCHAR(255) NOT NULL,
        // engine VARCHAR(255) NOT NULL,
        // fuelTankCapacity VARCHAR(255) NOT NULL,
        // seatingCapacity VARCHAR(255) NOT NULL,
        // price INT NOT NULL,
        // vehicleType VARCHAR(255) NOT NULL,
        // image VARCHAR(255) NOT NULL,
        // dealership UUID,
        // dealershipAgent VARCHAR,
        query = "INSERT INTO tblListing (modelAndName, make, fuelType, power, transmission, engine, fuelTankCapacity, seatingCapacity, price, vehicleType, image, dealership, dealershipAgent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *";

        let newListing = (await pool.query(query, [modelAndName, make, fuelType, power, transmission, engine, fuelTankCapacity, seatingCapacity, price, vehicleType, imageURL, dealership.id, req.tokenData.userid]));

        // console.log(newListing)

        return res.status(200).json({ "message": "Successfully listed vehicle" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ "message": "Internal Server Error" });
    }
})

//TODO more dynamic filter
const getListing = asyncHandler(async (req, res) => {
    try {
        const { listingId, dealershipId, dealerAgentId } = req.query;

        if (listingId) {
            let query = `
            SELECT l.*, 
                a AS dealershipagent,
                d AS dealership
            FROM tblListing l
            LEFT JOIN tblUserProfile a ON l.dealershipAgent = a.userid
            LEFT JOIN tblDealership d ON l.dealership = d.id
            WHERE l.id = $1
            GROUP BY l.id, a, d`;

            const result = (await pool.query(query, [listingId])).rows[0];

            const dealership = result.dealership.split(',');
            const agent = result.dealershipagent.split(',');

            result.dealership = {
                dealershipId: dealership[0].trim(),
                name: dealership[1].trim(),
                managerId: dealership[2].trim(),
                address: dealership[5].trim(),
            }
            result.dealershipagent = {
                userId: agent[1].trim(),
                firstname: agent[2].trim(),
                lastName: agent[3].trim(),
                phoneNumber: agent[4].trim()
            };
            return res.status(200).json(result);
        }

        if (dealershipId) {
        }

        let query = "SELECT * FROM tblListing";
        const listings = (await pool.query(query)).rows
        return res.status(200).json(listings);
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ "message": "Internal Server Error" });
    }
})

const getDealership = asyncHandler(async (req, res) => {
    const { dealershipName, dealershipId } = req.query;

    if (dealershipName) {
        const filter = `%${dealershipName.toLowerCase()}%`;
        let query = `SELECT * FROM tblDealership WHERE LOWER(name) LIKE $1`;
        const dealerships = (await pool.query(query, [filter])).rows;
        return res.status(200).json(dealerships);
    }

    if (dealershipId) {
        let query = `
        SELECT d.*, 
            m AS manager
        FROM tblDealership d
        LEFT JOIN tblUserProfile m ON d.manager = m.userId
        WHERE d.id = $1`;

        const result = (await pool.query(query, [dealershipId])).rows[0];

        console.log(result);
        const managerParts = result.manager.split(',');
        result.manager = {
            userId: managerParts[1].trim(),
            firstname: managerParts[2].trim(),
            lastName: managerParts[3].trim(),
            phoneNumber: managerParts[4].trim()
        };
        return res.status(200).json(result);
    }
    let query = "SELECT * FROM tblDealership";
    const dealerships = (await pool.query(query)).rows;
    return res.status(200).json(dealerships);
})

const deleteListing = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['listingId'];
        validateRequiredFields(requiredFields, req.body, res);

        const listingDocRef = doc(listingCol, req.body.listingId);
        const listingDocSnapshot = await getDoc(listingDocRef);

        if (!listingDocSnapshot.exists()) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const listingData = listingDocSnapshot.data();
        if (listingData.dealerId !== req.tokenData.id) {
            return res.status(403).json({ message: "Unauthorized access to listing" });
        }

        await deleteDoc(listingDocRef);
        return res.status(200).json({ message: "Deleted listing successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


const requestDealershipManagerPrivilege = asyncHandler(async (req, res) => {
    try {
        const now = new Date();
        await addDoc(requestCol, {
            requestType: 1,
            userId: req.tokenData.id,
            createdAt: now,
            updatedAt: now
        })
        return res.status(200).json({ message: "Successfully requested privilege" })
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: e.message })
    }
})

const updateUserPrivilege = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ["userId", "privilege"];
        validateRequiredFields(requiredFields, req.body, res);

        const { userId, privilege } = req.body;
        const userDocRef = doc(usersCol, userId);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.empty) {
            return res.status(400).json({ message: "User not found" });
        }

        const updateData = {
            privilege: privilege
        };

        await updateDoc(userDocRef, updateData);
        return res.status(200).json({ message: "Updated user privilege" });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: e.message })
    }
})

const getUser = asyncHandler(async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = { id: userDoc.id, ...userDoc.data() };

        return res.status(200).json(userData);
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


const getUsers = asyncHandler(async (req, res) => {
    const usersSnapshot = await getDocs(buyerCol);
    const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(usersList);
})

module.exports = {
    buyerRegister,
    dealerRegister,
    login,
    getUserProfile,

    updateUserProfile,

    getDealership,


    // updateBuyerUserProfile,
    // updateDealerAgentUserProfile,


    createListing,
    deleteListing,

    requestDealershipManagerPrivilege,

    updateUserPrivilege,

    getListing,

    getUsers
}