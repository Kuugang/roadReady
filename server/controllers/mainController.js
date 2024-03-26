const path = require("path");
const { v4: uuidv4, validate } = require('uuid');
const { db } = require("../config/dbConfig");
const { supabase, pool } = require("../config/supabaseConfig")
const asyncHandler = require("express-async-handler");

const { validateRequiredFields } = require("./helper")
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars')
const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
)

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

async function sendMail(mailOptions,) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'jakebajo21@gmail.com',
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken
            }
        })

        const handlebarOptions = {
            viewEngine: {
                partialsDir: path.resolve(__dirname, '../views/'),
                defaultLayout: false,
            },
            viewPath: path.resolve(__dirname, '../views/'),
        };

        transport.use('compile', hbs(handlebarOptions))

        const result = await transport.sendMail(mailOptions)
        return result;
    } catch (error) {
        return error
    }
}

const buyerRegister = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['email', 'password', 'firstName', 'lastName', 'phoneNumber', 'address', 'gender'];
        const fieldsValidation = validateRequiredFields(requiredFields, req.body, res);
        if (fieldsValidation) return fieldsValidation

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
        const fieldsValidation = validateRequiredFields(requiredFields, req.body, res);
        if (fieldsValidation) return fieldsValidation;

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

        const createDealershipAgent = `INSERT INTO tblDealershipAgent (id, dealership) VALUES ($1, $2)`
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
    const fieldsValidation = validateRequiredFields(['email', 'password'], req.body, res)
    if (fieldsValidation) return fieldsValidation;
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
    res.cookie('access_token', data.session.access_token, {
        path: '/',
        domain: '',
        sameSime: 'None',
        secure: true
    })

    user.token = token;
    return res.status(200).json(user);
});

const getUserProfile = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['userId']
        const fieldsValidation = validateRequiredFields(requiredFields, req.query, res);

        if (fieldsValidation) return fieldsValidation;

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
            WHERE id = $${Object.keys(updates).length + 1}
            RETURNING *;
        `;
        const { rows: userProfile, error: profileError } = await pool.query(updateUserProfileQuery, [...updateValues, req.tokenData.id]);
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

const requestOTPCode = asyncHandler(async (req, res) => {
    try {
        const code = Math.floor(1000 + Math.random() * 9000);
        const { data: { user } } = await supabase.auth.getUser(req.cookies.access_token)
        const mailOptions = {
            from: 'Road Ready <jakebajo21@gmail.com>',
            to: user.email,
            subject: 'Your OTP Code',
            template: 'otp',
            context: {
                code: code
            }
        }
        await sendMail(mailOptions);
        let query = "DELETE FROM tblOTP WHERE userId = $1";
        await pool.query(query, [user.id]);
        query = "INSERT INTO tblOTP (code, userId, expiredAt) VALUES ($1, $2, $3)"
        let currentDate = new Date();
        currentDate.setMinutes(currentDate.getMinutes() + 10);
        await pool.query(query, [code, user.id, currentDate]);
        return res.status(200).json({ message: "OTP code sent to your email" })
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
})

// for buyer role only
const verify = asyncHandler(async (req, res) => {
    try {
        const fieldsValidation = validateRequiredFields(['code'], req.body, res);
        if (fieldsValidation) return fieldsValidation;
        const { code } = req.body;

        const { data: { user }, error } = await supabase.auth.getUser(req.cookies.access_token)
        let query = "SELECT * FROM tblUserProfile WHERE id = $1";
        const userProfile = (await pool.query(query, [user.id])).rows[0];

        if (userProfile.role != 'buyer') {
            return res.sendStatus(401);
        }

        query = "SELECT * FROM tblOTP WHERE userId = $1";
        const otp = (await pool.query(query, [user.id])).rows[0];
        if (otp.code != code) {
            return res.status(400).send({ message: "Invalid code" })
        }
        if (otp.expiredat < new Date()) {
            return res.status(400).json({ message: "This OTP code has expired please request for another code" });
        }
        query = "UPDATE tblUserProfile SET isApproved = TRUE WHERE id = $1";
        await pool.query(query, [user.id]);
        return res.status(200).send({ message: "Verification success" })
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
})
//LISTING
const createListing = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['modelAndName', 'make', 'fuelType', 'power', 'transmission', 'engine', 'fuelTankCapacity', 'seatingCapacity', 'price', 'dealershipName', 'vehicleType'];
        const fieldsValidation = validateRequiredFields(requiredFields, req.body, res);
        if (fieldsValidation) return fieldsValidation;
        const { modelAndName, make, fuelType, power, transmission, engine, fuelTankCapacity, seatingCapacity, price, dealershipName, vehicleType } = req.body;

        let query = "SELECT * FROM tblDealership WHERE name = $1"
        const dealership = (await pool.query(query, [dealershipName])).rows[0];
        if (!dealership)
            return res.status(404).json({ message: "Dealership not found" });

        query = "SELECT * FROM tblDealershipAgent WHERE userid = $1 AND isAuthorized = TRUE AND dealership = $2";
        const dealer = (await pool.query(query, [req.tokenData.id, dealership.id])).rows[0];
        if (!dealer) {
            return res.status(401).send("Unauthorized");
        }

        const { data, error } = await supabase.storage.from('listing').upload(uuidv4(), req.file.buffer, {
            contentType: req.file.mimetype
        });
        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
        const imageURL = `https://xjrhebmomygxcafbvlye.supabase.co/storage/v1/object/public/` + data.fullPath;
        query = "INSERT INTO tblListing (modelAndName, make, fuelType, power, transmission, engine, fuelTankCapacity, seatingCapacity, price, vehicleType, image, dealership, dealershipAgent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *";
        let newListing = (await pool.query(query, [modelAndName, make, fuelType, power, transmission, engine, fuelTankCapacity, seatingCapacity, price, vehicleType, imageURL, dealership.id, req.tokenData.id]));
        return res.status(200).json({ "message": "Successfully listed vehicle" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ "message": "Internal Server Error" });
    }
})

//TODO more dynamic filter
const getListing = asyncHandler(async (req, res) => {
    try {
        const { listingId, dealershipId, dealershipAgentId } = req.query;

        if (listingId) {
            let query = `
            SELECT l.*,
                   json_build_object('id', d.id, 
                                     'name', d.name, 
                                     'address', d.address, 
                                     'latitude', d.latitude,
                                     'longitude', d.longitude) AS dealership,
                    json_build_object('id', a.id,
                                    'firstName', a.firstname,
                                    'lastName', a.lastname,
                                    'phoneNumber', a.phoneNumber) AS dealershipAgent
                    FROM tblListing l
            LEFT JOIN tblDealership d ON l.dealership = d.id
            LEFT JOIN tblUserProfile a ON l.dealershipAgent = a.id
            WHERE l.id = $1`;

            const result = (await pool.query(query, [listingId])).rows[0];
            return res.status(200).json(result);
        }

        if (dealershipId) {
            let query = `SELECT l.*,
                   json_build_object('id', d.id, 
                                     'name', d.name, 
                                     'address', d.address, 
                                     'latitude', d.latitude,
                                     'longitude', d.longitude) AS dealership,
                    json_build_object('id', a.id,
                                    'firstName', a.firstname,
                                    'lastName', a.lastname,
                                    'phoneNumber', a.phoneNumber) AS dealershipAgent
                    FROM tblListing l
            LEFT JOIN tblDealership d ON l.dealership = d.id
            LEFT JOIN tblUserProfile a ON l.dealershipAgent = a.id
            WHERE l.dealership = $1`;

            const listings = (await pool.query(query, [dealershipId])).rows;
            return res.status(200).json(listings);
        }

        if (dealershipAgentId) {
            let query = `SELECT l.*,
                   json_build_object('id', d.id, 
                                     'name', d.name, 
                                     'address', d.address, 
                                     'latitude', d.latitude,
                                     'longitude', d.longitude) AS dealership,
                    json_build_object('id', a.id,
                                    'firstName', a.firstname,
                                    'lastName', a.lastname,
                                    'phoneNumber', a.phoneNumber) AS dealershipAgent
                    FROM tblListing l
            LEFT JOIN tblDealership d ON l.dealership = d.id
            LEFT JOIN tblUserProfile a ON l.dealershipAgent = a.id
            WHERE l.dealershipagent = $1`;

            const listings = (await pool.query(query, [dealershipAgentId])).rows;
            return res.status(200).json(listings);
        }

        let query = `SELECT l.*,
                json_build_object('id', d.id, 
                                    'name', d.name, 
                                    'address', d.address, 
                                    'latitude', d.latitude,
                                    'longitude', d.longitude) AS dealership,
                json_build_object('id', a.id,
                                'firstName', a.firstname,
                                'lastName', a.lastname,
                                'phoneNumber', a.phoneNumber) AS dealershipAgent
                FROM tblListing l
        LEFT JOIN tblDealership d ON l.dealership = d.id
        LEFT JOIN tblUserProfile a ON l.dealershipAgent = a.id`;

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

        let query = `
        SELECT d.*,
               json_build_object('id', u.id, 
                                 'firstName', u.firstname, 
                                 'lastName', u.lastname, 
                                 'phoneNumber', u.phonenumber) AS manager
                FROM tblDealership d
        LEFT JOIN tblUserProfile u ON d.manager = u.id
        WHERE LOWER(name) LIKE $1`;

        const dealerships = (await pool.query(query, [filter])).rows;
        return res.status(200).json(dealerships);
    }

    if (dealershipId) {
        let query = `
        SELECT d.*,
               json_build_object('id', u.id, 
                                 'firstName', u.firstname, 
                                 'lastName', u.lastname, 
                                 'phoneNumber', u.phonenumber) AS manager
                FROM tblDealership d
        LEFT JOIN tblUserProfile u ON d.manager = u.id
        WHERE d.id = $1`;

        const result = (await pool.query(query, [dealershipId])).rows[0];
        if (!result) return res.status(404).json({ message: "dealership not found" });
        return res.status(200).json(result);
    }
    let query = `
    SELECT d.*,
           json_build_object('id', u.id, 
                             'firstName', u.firstname, 
                             'lastName', u.lastname, 
                             'phoneNumber', u.phonenumber) AS manager
            FROM tblDealership d
    LEFT JOIN tblUserProfile u ON d.manager = u.id`;

    const dealerships = (await pool.query(query)).rows;

    return res.status(200).json(dealerships);
})

const deleteListing = asyncHandler(async (req, res) => {
    const fieldsValidation = validateRequiredFields(['listingId'], req.body, res);
    if (fieldsValidation) return fieldsValidation;
    try {
        let query = "DELETE FROM tblListing WHERE id = $1 AND dealershipagent = $2"
        await (pool.query(query, [listingId, req.tokenData.id]));
        return res.status(200).json({ message: "successfully deleted listing" });
    } catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
});

const updateListing = asyncHandler(async (req, res) => {
    try {
        const fieldsValidation = validateRequiredFields(['listingId'], req.body, res);
        if (fieldsValidation) return fieldsValidation;

        const { listingId } = req.body;
        const updateFields = ['modelAndName', 'make', 'fuelType', 'power', 'transmission', 'engine', 'fuelTankCapacity', 'seatingCapacity', 'price', 'vehicleType'];

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

        let query = `
            UPDATE tblListing 
            SET ${Object.keys(updates).map((key, index) => `${key} = ${updatePlaceholders[index]}`).join(', ')}
            WHERE id = $${Object.keys(updates).length + 1} AND dealershipAgent = $${Object.keys(updates).length + 2}
            RETURNING *;
        `;


        const updatedRow = (await pool.query(query, [...updateValues, listingId, req.tokenData.id])).rows[0];
        if (!updatedRow) return res.sendStatus(401);
        return res.status(200).json({ message: "updated listing succesfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
});



const createCashApplicationRequest = asyncHandler(async (req, res) => {
    const requiredFields = ['listingId'];
    const fieldsValidation = validateRequiredFields(requiredFields, req.body, res);
    if (fieldsValidation) return fieldsValidation;
    const { listingId } = req.body;


    let query = "SELECT * FROM tblListing WHERE id = $1 AND isAvailable = TRUE";
    const listing = (await pool.query(query, [listingId])).rows[0];
    if (!listing) return res.status(404).json({ message: "listing not found" })

    const signature = req.files['signature'][0];
    const validId = req.files['validId'][0];

    const { data: validIdUploadData, error: validIdUploadError } = await supabase.storage.from('request/validId').upload(uuidv4(), validId.buffer, {
        contentType: validId.mimetype
    });

    if (validIdUploadError) {
        return res.status(500).json({ success: false, error: validIdUploadError });
    }

    const { data: signatureUploadData, error: signatureUploadError } = await supabase.storage.from('request/signature').upload(uuidv4(), signature.buffer, {
        contentType: signature.mimetype
    });

    if (signatureUploadError) {
        return res.status(500).json({ success: false, error: signatureUploadError });
    }

    const validIdURL = `https://xjrhebmomygxcafbvlye.supabase.co/storage/v1/object/public/` + validIdUploadData.fullPath
    const signatureURL = `https://xjrhebmomygxcafbvlye.supabase.co/storage/v1/object/public/` + signatureUploadData.fullPath

    // id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    //     buyerId UUID NOT NULL,
    //         listingId UUID NOT NULL,
    //             validId VARCHAR NOT NULL,
    //                 signature VARCHAR NOT NULL,
    //                     progress INT NOT NULL DEFAULT 1,
    // --1 documents is on review
    // --2 background checking / criminal investigation on review
    // --3 releasing of unit
    // --4 registration on progress
    // --5 request successful

    query = "INSERT INTO tblCashApplicationRequest (buyerId, listingId, validId, signature) VALUES ($1, $2, $3, $4)";
    const { data, error } = await pool.query(query, [req.tokenData.id, listingId, validIdURL, signatureURL]);
    return res.status(200).json({ message: "application request created successfully" })
})

const createInstallmentApplicationRequest = asyncHandler(async (req, res) => {
    try {
        const requiredFields = ['listingId', 'coMakerFirstName', 'coMakerLastName', 'coMakerPhoneNumber'];
        const fieldsValidation = validateRequiredFields(requiredFields, req.body, res);
        if (fieldsValidation) return fieldsValidation;

        const { listingId, coMakerFirstName, coMakerLastName, coMakerPhoneNumber } = req.body;

        let query = "SELECT * FROM tblListing WHERE id = $1";
        const listing = (await pool.query(query, [listingId])).rows[0];

        if (!listing) return res.status(404).json({ message: "listing not found" });
        if (listing.isavailable == false) return res.status(400).json({ message: "listing is not available" });

        const buyerSignature = req.files['buyerSignature'][0];
        const buyerValidId = req.files['buyerValidId'][0];
        const coMakerValidId = req.files['coMakerValidId'][0];
        const coMakerSignature = req.files['coMakerSignature'][0];

        const { data: buyerSignatureUploadData, error: buyerSignatureUploadError } = await supabase.storage.from('request/signature').upload(uuidv4(), buyerSignature.buffer, {
            contentType: buyerSignature.mimetype
        });

        if (buyerSignatureUploadError) {
            return res.status(500).json({ success: false, error: buyerSignatureUploadError });
        }

        const { data: buyerValidIdUploadData, error: buyerValidIdUploadError } = await supabase.storage.from('request/validId').upload(uuidv4(), buyerValidId.buffer, {
            contentType: buyerValidId.mimetype
        });

        if (buyerValidIdUploadError) {
            return res.status(500).json({ success: false, error: buyerValidIdUploadError });
        }

        const { data: coMakerSignatureUploadData, error: coMakerSignatureUploadError } = await supabase.storage.from('request/signature').upload(uuidv4(), coMakerSignature.buffer, {
            contentType: coMakerSignature.mimetype
        });

        if (coMakerSignatureUploadError) {
            return res.status(500).json({ success: false, error: coMakerSignatureUploadError });
        }

        const { data: coMakerValidIdUploadData, error: coMakerValidIdUploadError } = await supabase.storage.from('request/validId').upload(uuidv4(), coMakerValidId.buffer, {
            contentType: coMakerValidId.mimetype
        });

        if (coMakerValidIdUploadError) {
            return res.status(500).json({ success: false, error: coMakerValidIdUploadError });
        }
        const buyerSignatureURL = `https://xjrhebmomygxcafbvlye.supabase.co/storage/v1/object/public/` + buyerSignatureUploadData.fullPath
        const buyerValidIdURL = `https://xjrhebmomygxcafbvlye.supabase.co/storage/v1/object/public/` + buyerValidIdUploadData.fullPath

        const coMakerSignatureURL = `https://xjrhebmomygxcafbvlye.supabase.co/storage/v1/object/public/` + coMakerSignatureUploadData.fullPath
        const coMakerValidIdURL = `https://xjrhebmomygxcafbvlye.supabase.co/storage/v1/object/public/` + coMakerValidIdUploadData.fullPath

        //id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        //buyerId UUID NOT NULL,
        //listingId UUID NOT NULL,
        //validId VARCHAR NOT NULL,
        //signature VARCHAR NOT NULL,

        //coMakerFirstName VARCHAR NOT NULL,
        //coMakerLastName VARCHAR NOT NULL,
        //coMakerPhoneNumber VARCHAR NOT NULL,
        //coMakeValidId VARCHAR NOT NULL,
        //coMakeSignature VARCHAR NOT NULL,

        //progress INT NOT NULL DEFAULT 1,
        //-- 1 documents is on review
        //-- 2 background checking/ criminal investigation on review
        //-- 3 releasing of unit
        //-- 4 registration on progress
        //-- 5 request successful
        query = "INSERT INTO tblInstallmentApplicationRequest (buyerId, listingId, validId, signature, coMakerFirstName, coMakerLastName, coMakerPhoneNumber, coMakerValidId, coMakerSignature) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"

        try {
            const { data, error } = await pool.query(query, [req.tokenData.id, listingId, buyerValidIdURL, buyerSignatureURL, coMakerFirstName, coMakerLastName, coMakerPhoneNumber, coMakerValidIdURL, coMakerSignatureURL]);
            return res.status(200).json({ message: "application request created successfully" })
        } catch (error) {
            if (error.code == '23505') {
                // await Promise.all([
                //     supabase.storage.from('request/signature').remove([buyerSignatureUploadData.fullPath]),
                //     supabase.storage.from('request/validId').remove([buyerValidIdUploadData.fullPath]),
                //     supabase.storage.from('request/signature').remove([coMakerSignatureUploadData.fullPath]),
                //     supabase.storage.from('request/validId').remove([coMakerValidIdUploadData.fullPath])
                // ]);
                return res.status(500).json({ success: false, error: error });
            }
            throw new Error(error)
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json(error);
    }
})

const createVehicle = async (listing, buyerId) => {
    const { modelandname, make, fueltype, power, transmission, engine, fueltankcapacity, seatingcapacity, price, vehicletype, image, dealership, dealershipagent } = listing;
    let query = "INSERT INTO tblVehicle (id, userId, modelAndName, make, fuelType, power, transmission, engine, fuelTankCapacity, seatingCapacity, price, vehicleType, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *";
    const vehicle = (await (pool.query(query, [listing.id, buyerId, modelandname, make, fueltype, power, transmission, engine, fueltankcapacity, seatingcapacity, price, vehicletype, image]))).rows[0];

    query = "INSERT INTO tblRegistrationRequest (vehicleId, dealership, dealershipAgent) VALUES ($1, $2, $3)"
    await (pool.query(query, [vehicle.id, dealership, dealershipagent]));
}

const updateApplicationRequest = asyncHandler(async (req, res) => {
    try {
        const fieldsValidation = validateRequiredFields(['progress, listingId'], req.body, res);
        if (fieldsValidation) return fieldsValidation;
        const { cashApplicationRequest, installmentApplicationRequest, progress, listingId } = req.body;
        //progress 1-5;
        //should be an authorized agent and should be "employed" in the dealership

        let query = "SELECT * FROM tblDealershipAgent WHERE id = $1 AND isAuthorized = true";
        const agent = (await pool.query(query, [req.tokenData.id])).rows[0];
        if (!agent) return res.sendStatus(401);

        query = "SELECT * FROM tblListing WHERE id = $1";
        const listing = (await pool.query(query, [listingId])).rows[0];
        if (!listing) return res.status(404).json({ message: "listing not found" });
        if (listing.dealershipagent != req.tokenData.id) return res.sendStatus(401);

        if (cashApplicationRequest) {
            let query = "UPDATE tblCashApplicationRequest SET progress = $1 RETURNING *";
            const applicationRequest = (await pool.query(query, [progress])).rows[0];

            //delete other applications on this listing if it is already released
            if (applicationRequest.progress >= 4) return res.status(400).json({ message: "vehicle is already released" })

            if (progress == 4) {
                query = "UPDATE tblListing SET isAvailable = false WHERE id = $1";
                await pool.query(query, [listing.id]);
                createVehicle(listing, applicationRequest.buyerid);
            }

            return res.status(200).json({ message: "updated application progress" })
        }

        if (installmentApplicationRequest) {
            let query = "UPDATE tblInstallmentApplicationRequest SET progress = $1 RETURNING *";
            const applicationRequest = (await pool.query(query, [progress])).rows[0];

            //delete other applications on this listing if it is already released
            if (applicationRequest.progress >= 4) return res.status(400).json({ message: "vehicle is already released" })

            query = "UPDATE tblListing SET isAvailable = false WHERE id = $1";
            await pool.query(query, [listing.id]);
            if (progress == 4) {
                createVehicle(listing, applicationRequest.buyerid);
            }

            return res.status(200).json({ message: "updated application progress" })
        }

        return res.status(400).json({ message: "application type is required" })
    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
})

const updateRegistrationRequest = asyncHandler(async (req, res) => {
    try {
        const fieldsValidation = validateRequiredFields(['registrationRequestId', 'progress'], req.body, res);
        if (fieldsValidation) return fieldsValidation;
        const { registrationRequestId, progress } = req.body;

        let query = "UPDATE tblRegistrationRequest SET progress = $1 WHERE id = $2 AND dealershipagent = $3 RETURNING *";
        const request = (await pool.query(query, [progress, registrationRequestId, req.tokenData.id])).rows[0];

        if (progress == 3) {
            const registeredOn = new Date();
            const expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 3);

            query = "UPDATE tblVehicle SET isRegistered = true, registeredon = $1, registrationexpiry = $2"
            await pool.query(query, [registeredOn, expiry])

            query = "UPDATE tblCashApplicationRequest SET progress = 5 WHERE listingId = $1";
            await pool.query(query, [request.vehicleid]);

            query = "UPDATE tblInstallmentApplicationRequest SET progress = 5 WHERE listingId = $1";
            await pool.query(query, [request.vehicleid]);
        }
        return res.status(200).json({ message: "updated registration progress" });
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
})


//dealershipManager
const updateAgentStatus = asyncHandler(async (req, res) => {
    try {
        const fieldsValidation = validateRequiredFields(['agentId', 'isApproved'], req.body, res);
        const { agentId, isApproved } = req.body;
        if (fieldsValidation) return fieldsValidation;

        let query = "UPDATE tblDealershipAgent SET isAuthorized = $1 WHERE id = $2";
        await pool.query(query, [isApproved, agentId]);
    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
});
//admin
const updateUserStatus = asyncHandler(async (req, res) => {
    try {
        const fieldsValidation = validateRequiredFields(['userId', 'isApproved'], req.body, res);
        if (fieldsValidation) return fieldsValidation;
        const { userId, isApproved } = req.body;

        let query = "SELECT * FROM tblUserProfile WHERE id = $1";
        const user = (await pool.query(query, [userId])).rows[0];

        if (user.role == "dealershipAgent") {
            query = "UPDATE tblDealershipAgent SET isAuthorized = $1 WHERE id = $2";
            await pool.query(query, [isApproved, userId]);
        }

        query = "UPDATE tblUserProfile SET isApproved = $1 WHERE id = $2";
        await pool.query(query, [isApproved, userId]);
        return res.status(200).json({ message: "successfully updated user status" });
    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
})


//--------------------
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

const getUsers = asyncHandler(async (req, res) => {
    try {
        let query = "SELECT * FROM tblUserProfile";
        const users = (await pool.query(query)).rows;
        return res.status(200).json(users);
    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
})

module.exports = {
    buyerRegister,
    dealerRegister,
    login,
    getUserProfile,

    updateUserProfile,

    getDealership,

    createCashApplicationRequest,
    createInstallmentApplicationRequest,


    createListing,
    deleteListing,
    updateListing,
    updateApplicationRequest,
    updateRegistrationRequest,

    requestOTPCode,
    verify,

    //dealershipManager
    updateAgentStatus,
    //admin
    updateUserStatus,
    // updateBuyerUserProfile,
    // updateDealerAgentUserProfile,



    requestDealershipManagerPrivilege,

    getListing,

    getUsers
}