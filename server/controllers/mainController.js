const asyncHandler = require("express-async-handler");
const { collection, getDocs, getDoc, doc, query, where, addDoc, deleteDoc, updateDoc } = require("firebase/firestore/lite")
const { getStorage, ref, getDownloadURL, uploadBytesResumable } = require("firebase/storage")

const { validateRequiredFields } = require("./helper")
const { db } = require("../config/dbConfig");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const storage = getStorage();

const adminCol = collection(db, 'admin');
const listingCol = collection(db, 'listing');
const buyerCol = collection(db, 'buyer');
const dealershipCol = collection(db, 'dealership');
const dealerCol = collection(db, 'dealer');
const requestCol = collection(db, 'request');
const usersCol = collection(db, "users");

const buyerRegister = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['username', 'password', 'email', 'firstName', 'lastName', 'phoneNumber', 'address', 'gender'];
        validateRequiredFields(requiredFields, req.body, res);

        let { username, password, email, firstName, lastName, phoneNumber, address, gender } = req.body;

        const userQuery = query(usersCol, where('username', '==', username));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty)
            return res.status(409).json({ message: "Username already taken" });

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await addDoc(usersCol, {
            firstName,
            lastName,
            username,
            password: hashedPassword,
            email,
            phoneNumber,
            gender,
            address,
            privilege: "buyer"
        });


        return res.status(200).json({ "status": "success", "message": "Registered succesfully" });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send(error);
    }
});


const dealerRegister = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['username', 'password', 'email', 'firstName', 'lastName', 'phoneNumber', 'address', 'gender', "dealershipName"];

        validateRequiredFields(requiredFields, req.body, res);

        let { username, password, email, firstName, lastName, phoneNumber, address, gender, dealershipName } = req.body;

        const dealershipQuery = query(dealershipCol, where('name', '==', dealershipName));
        const dealershipSnapshot = await getDocs(dealershipQuery);

        if (dealershipSnapshot.empty) {
            return res.status(404).json({ message: "Dealership not found" });
        }

        const userQuery = query(usersCol, where('username', '==', username));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty)
            return res.status(409).json({ message: "Username already taken" });

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await addDoc(usersCol, {
            requestType: 1,
            firstName,
            lastName,
            username,
            password: hashedPassword,
            email,
            phoneNumber,
            gender,
            address,
            dealershipName,
            privilege: "dealershipAgentApplicant",
        });

        return res.status(200).json({ "status": "success", "message": "Dealer agent request created successfully" });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send(error);
    }
});

const login = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['username', 'password', 'loginType'];

        validateRequiredFields(requiredFields, req.body, res);

        const { username, password, loginType } = req.body;

        if (loginType != "dealer" && loginType != "buyer" && loginType != "admin") return res.status(400).json({ "message": "invalid login type" });

        let col;
        switch (loginType) {
            case "dealer":
            case "buyer":
                col = usersCol
                break;
            case "admin":
                col = adminCol;
                break;
        }

        const userQuery = query(col, where('username', '==', username));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            return res.status(400).json({ "message": "Invalid username or password" });
        }

        let user;
        userSnapshot.forEach((doc) => {
            user = doc.data();
            user.id = doc.id;
        });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ "message": "Invalid username or password" });
        }

        let { id, username: fetchedUsername, firstname, lastname, privilege } = user;
        if (loginType == "admin") privilege = "admin";

        const token = jwt.sign(
            { id, username: fetchedUsername, firstname, lastname, privilege },
            process.env.JWT_SECRET,
            { expiresIn: 86400 }
        );

        res.cookie('jwt', token, {
            path: '/',
            domain: '',
            sameSite: 'None',
            secure: true
        });

        res.status(200).json({
            user: {
                id,
                username: fetchedUsername,
                firstname,
                lastname,
                privilege,
                token
            }
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send("Internal Server Error");
    }
});

//LISTING

const createListing = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['modelAndName', 'make', 'fuelType', 'power', 'transmission', 'engine', 'fuelTankCapacity', 'seatingCapacity', 'price'];

        validateRequiredFields(requiredFields, req.body, res);

        const { modelAndName, make, fuelType, power, transmission, engine, fuelTankCapacity, seatingCapacity, price } = req.body;

        const metadata = {
            contentType: req.file.mimetype
        }

        const storageRef = ref(storage, `listing/${req.file.originalname + "" + new Date()}`);
        const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata)

        const imageURL = await getDownloadURL(snapshot.ref);
        const newListingRef = await addDoc(listingCol, {
            modelAndName, make, fuelType, power, transmission, engine, fuelTankCapacity, seatingCapacity, price, imageURL, dealerId: req.tokenData.id,
        });

        const newListingDoc = await getDoc(newListingRef);
        const newListing = newListingDoc.data();

        return res.status(200).json({ "message": "Successfully listed vehicle", "list": newListing });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ "message": "Internal Server Error" });
    }
})

const getListing = asyncHandler(async (req, res) => {
    try {
        const { listingId } = req.body;

        if (listingId) {
            const listingDocRef = doc(listingCol, req.body.listingId);
            const listingDocSnapshot = await getDoc(listingDocRef);

            if (!listingDocSnapshot.exists()) {
                return res.status(404).json({ message: "Listing not found" });
            }

            const listingData = listingDocSnapshot.data();
            console.log(listingData.dealerId);
            return res.status(200).json({ listing: listingData });
        }

        const listingsSnapshot = await getDocs(listingCol);
        const listingsList = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ "listings": listingsList });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ "message": "Internal Server Error" });
    }
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
    createListing,
    deleteListing,

    requestDealershipManagerPrivilege,

    updateUserPrivilege,

    getListing,

    getUsers
}
