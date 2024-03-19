const asyncHandler = require("express-async-handler");
const { collection, getDocs, getDoc, doc, query, where, addDoc } = require("firebase/firestore/lite")
const { validateRequiredFields } = require("./helper")
const { db } = require("../config/dbConfig");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const buyerRegister = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['username', 'password', 'email', 'firstName', 'lastName', 'phonenumber', 'address', 'gender'];
        const validationError = validateRequiredFields(requiredFields, req.body);

        if (validationError) {
            return res.status(400).json(validationError);
        }

        let { username, password, email, firstName, lastName, phonenumber, address, gender } = req.body;

        const usersCol = collection(db, 'buyer');

        const userQuery = query(usersCol, where('username', '==', username));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty)
            return res.status(409).send("Username already taken");

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUserRef = await addDoc(usersCol, {
            firstName,
            lastName,
            username,
            password: hashedPassword,
            email,
            phonenumber,
            gender,
            address,
            privilege: "buyer"
        });

        const newUserDoc = await getDoc(newUserRef);
        const newUser = newUserDoc.data();

        return res.status(200).json({ "status": "success", "message": "Registered succesfully" });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send(error);
    }
});


const dealerRegister = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['username', 'password', 'email', 'firstName', 'lastName', 'phoneNumber', 'address', 'gender', "dealershipName"];
        const validationError = validateRequiredFields(requiredFields, req.body);

        if (validationError) {
            return res.status(400).json(validationError);
        }

        let { username, password, email, firstName, lastName, phoneNumber, address, gender, dealershipName } = req.body;

        const usersCol = collection(db, 'dealer');

        const userQuery = query(usersCol, where('username', '==', username));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty)
            return res.status(409).send("Username already taken");

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUserRef = await addDoc(usersCol, {
            firstName,
            lastName,
            username,
            password: hashedPassword,
            email,
            phoneNumber,
            gender,
            address,
            dealershipName,
            privilege: "dealer"
        });

        const newUserDoc = await getDoc(newUserRef);
        const newUser = newUserDoc.data();

        return res.status(200).json({ "status": "success", "message": "Registered succesfully" });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send(error);
    }
});

const login = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['username', 'password', 'loginType'];

        const validationError = validateRequiredFields(requiredFields, req.body);
        if (validationError) {
            return res.status(400).send(validationError);
        }

        const { username, password, loginType } = req.body;
        let col = "dealer";

        if (loginType == "buyer") {
            col = `buyer`;
        }

        const usersCol = collection(db, col);
        const userQuery = query(usersCol, where('username', '==', username));
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

        const { id, username: fetchedUsername, firstname, lastname, privilege } = user;

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

// const dealerLogin = asyncHandler(async (req, res) => {
//     try {
//         const requiredFields = ['username', 'password'];
//         const { username, password } = req.body;

//         const validationError = validateRequiredFields(requiredFields, req.body);
//         if (validationError) {
//             return res.status(400).send(validationError);
//         }

//         const usersCol = collection(db, 'dealer');
//         const userQuery = query(usersCol, where('username', '==', username));
//         const userSnapshot = await getDocs(userQuery);
//         if (userSnapshot.empty) {
//             return res.status(400).json({ "message": "Invalid username or password" });
//         }

//         let user;
//         userSnapshot.forEach((doc) => {
//             user = doc.data();
//             user.id = doc.id;
//         });

//         const passwordMatch = await bcrypt.compare(password, user.password);
//         if (!passwordMatch) {
//             return res.status(400).json({ "message": "Invalid username or password" });
//         }

//         const { id, username: fetchedUsername, firstname, lastname, privilege } = user;

//         const token = jwt.sign(
//             { id, username: fetchedUsername, firstname, lastname, privilege },
//             process.env.JWT_SECRET,
//             { expiresIn: 86400 }
//         );

//         res.cookie('jwt', token, {
//             path: '/',
//             domain: '',
//             sameSite: 'None',
//             secure: true
//         });

//         res.status(200).json({
//             user: {
//                 id,
//                 username: fetchedUsername,
//                 firstname,
//                 lastname,
//                 privilege,
//                 token
//             }
//         });
//     } catch (error) {
//         console.error("Error:", error);
//         return res.status(500).send("Internal Server Error");
//     }
// });


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
    const usersCol = collection(db, 'buyer');
    const usersSnapshot = await getDocs(usersCol);
    const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(usersList);
})

module.exports = {
    buyerRegister,
    dealerRegister,
    login,

    getUsers,
    getUser
}
