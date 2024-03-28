const { createClient, createRole } = require('@supabase/supabase-js');
const { Pool } = require("pg");
let supabase;
let pool;


const initializeDatabase = async () => {
    try {
        supabase = createClient(process.env.supabaseURL, process.env.supabaseKey)
        console.log("Connected to supabase")

        const databaseName = "postgres"
        const port = 5432

        pool = new Pool({
            user: process.env.user,
            host: process.env.host,
            database: databaseName,
            password: process.env.databasePassword,
            port: port,
        });

        const createGenderType = `
        DO $$ 
        BEGIN 
            IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
                CREATE TYPE gender AS ENUM('male', 'female', 'others');
            END IF;
        END $$;
        `;

        const createRoleType = `
        DO $$ 
        BEGIN 
            IF NOT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'role') THEN
                CREATE TYPE role AS ENUM('admin', 'buyer', 'dealershipManager', 'dealershipAgent', 'bankAgent');
            END IF;
        END $$;
        `;

        await pool.query(createRoleType);
        await pool.query(createGenderType);
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        let createUserProfileTable = `CREATE TABLE IF NOT EXISTS tblUserProfile(
            id UUID PRIMARY KEY,
            firstName VARCHAR(50) NOT NULL, 
            lastName VARCHAR(50) NOT NULL, 
            email VARCHAR NOT NULL,
            phoneNumber VARCHAR(50),
            address VARCHAR(255),
            gender gender,
            role role NOT NULL,
            isApproved BOOLEAN DEFAULT FALSE NOT NULL,

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMPTZ
        )`;

        await pool.query(createUserProfileTable);

        let createDealershipTable = `CREATE TABLE IF NOT EXISTS tblDealership(
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            manager UUID,
            latitude DECIMAL(9, 6) NOT NULL,
            longitude DECIMAL(9, 6) NOT NULL,
            address VARCHAR(255) NOT NULL,

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMPTZ,

            FOREIGN KEY(manager) REFERENCES tblUserProfile(id)
        )`;

        await pool.query(createDealershipTable);

        let createDealershipAgentTable = `CREATE TABLE IF NOT EXISTS tblDealershipAgent(
            id UUID PRIMARY KEY,
            dealership UUID NOT NULL,
            isAuthorized BOOL DEFAULT FALSE,

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMPTZ,

            FOREIGN KEY(userId) REFERENCES tblUserProfile(id),
            FOREIGN KEY(dealership) REFERENCES tblDealership(id)
        )`;

        await pool.query(createDealershipAgentTable);


        //create isAvailable column
        let createListingTable = `CREATE TABLE IF NOT EXISTS tblListing(
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            modelAndName VARCHAR(255) NOT NULL,
            make VARCHAR(255) NOT NULL,
            fuelType VARCHAR(255) NOT NULL,
            power VARCHAR(255) NOT NULL,
            transmission VARCHAR(255) NOT NULL,
            engine VARCHAR(255) NOT NULL,
            fuelTankCapacity VARCHAR(255) NOT NULL,
            seatingCapacity VARCHAR(255) NOT NULL,
            price INT NOT NULL,
            vehicleType VARCHAR(255) NOT NULL,
            image VARCHAR(255) NOT NULL,
            dealership UUID NOT NULL,
            dealershipAgent UUID NOT NULL,
            isAvailable BOOLEAN DEFAULT TRUE,

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMPTZ,

            FOREIGN KEY (dealership) REFERENCES tblDealership(id),
            FOREIGN KEY (dealershipAgent) REFERENCES tblUserProfile(id)
        );`

        await pool.query(createListingTable);

        let createCashPaymentRequestTable = `CREATE TABLE IF NOT EXISTS tblCashApplicationRequest (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            buyerId UUID NOT NULL,
            listingId UUID NOT NULL,
            validId VARCHAR NOT NULL,
            signature VARCHAR NOT NULL,
            progress INT NOT NULL CHECK (progress >= 1 AND progress <= 5) DEFAULT 1,
            -- 1 documents is on review
            -- 2 background checking/ criminal investigation on review
            -- 3 releasing of unit
            -- 4 registration on progress
            -- 5 request successful

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMPTZ,

            FOREIGN KEY (buyerId) REFERENCES tblUserProfile (id) ON DELETE CASCADE,
            FOREIGN KEY (listingId) REFERENCES tblListing (id) ON DELETE CASCADE,
            CONSTRAINT cash_unique_order UNIQUE (listingId, buyerId)

            --NICE TO HAVE: should enforce that the user has the role 
        )`;

        await pool.query(createCashPaymentRequestTable);

        let createInstallmentPaymentRequestTable = `CREATE TABLE IF NOT EXISTS tblInstallmentApplicationRequest(
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            buyerId UUID NOT NULL,
            listingId UUID NOT NULL,
            validId VARCHAR NOT NULL,
            signature VARCHAR NOT NULL,

            coMakerFirstName VARCHAR NOT NULL,
            coMakerLastName VARCHAR NOT NULL,
            coMakerPhoneNumber VARCHAR NOT NULL,
            coMakerValidId VARCHAR NOT NULL,
            coMakerSignature VARCHAR NOT NULL,

            progress INT NOT NULL CHECK (progress >= 1 AND progress <= 5) DEFAULT 1,
            -- 1 documents is on review
            -- 2 background checking/ criminal investigation on review
            -- 3 releasing of unit
            -- 4 registration on progress
            -- 5 request successful

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMPTZ,

            FOREIGN KEY (buyerId) REFERENCES tblUserProfile (id) ON DELETE CASCADE,
            FOREIGN KEY (listingId) REFERENCES tblListing (id) ON DELETE CASCADE,
            CONSTRAINT installment_unique_order UNIQUE (listingId, buyerId)
        )`;

        await pool.query(createInstallmentPaymentRequestTable);

        let createVehicleTable = `CREATE TABLE IF NOT EXISTS tblVehicle(
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            userId UUID NOT NULL,
            modelAndName VARCHAR(255) NOT NULL,
            make VARCHAR(255) NOT NULL,
            fuelType VARCHAR(255) NOT NULL,
            power VARCHAR(255) NOT NULL,
            transmission VARCHAR(255) NOT NULL,
            engine VARCHAR(255) NOT NULL,
            fuelTankCapacity VARCHAR(255) NOT NULL,
            seatingCapacity VARCHAR(255) NOT NULL,
            price INT NOT NULL,
            vehicleType VARCHAR(255) NOT NULL,
            image VARCHAR(255) NOT NULL, 
            isRegistered BOOLEAN DEFAULT FALSE NOT NULL,

            registeredOn TIMESTAMPTZ,
            registrationExpiry TIMESTAMPTZ,

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMPTZ,

            FOREIGN KEY (userId) REFERENCES tblUserProfile(id) ON DELETE CASCADE
        )`;

        await pool.query(createVehicleTable);

        let createRegistrationRequestTable = `CREATE TABLE IF NOT EXISTS tblRegistrationRequest(
            id UUID PRIMARY KEY,
            vehicleId UUID NOT NULL,
            listingId UUID NOT NULL,
            dealership UUID NOT NULL,
            dealershipAgent UUID NOT NULL,
            progress INT NOT NULL CHECK (progress >= 1 AND progress <= 3) DEFAULT 1,

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMPTZ,

            FOREIGN KEY (vehicleId) REFERENCES tblVehicle(id) ON DELETE CASCADE,
            FOREIGN KEY (listingId) REFERENCES tblListing (id) ON DELETE CASCADE,
            FOREIGN KEY (dealership) REFERENCES tblDealership (id) ON DELETE CASCADE,
            FOREIGN KEY (dealershipAgent) REFERENCES tblUserProfile (id)
        )`;

        await pool.query(createRegistrationRequestTable);


        let createOTPTable = `CREATE TABLE IF NOT EXISTS tblOTP(
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            userId UUID NOT NULL,
            code INT NOT NULL,

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            expiredAt TIMESTAMPTZ NOT NULL,
            isUsed BOOLEAN DEFAULT FALSE,

            FOREIGN KEY (userId) REFERENCES tblUserProfile (id)
        )`;

        await pool.query(createOTPTable);

        console.log("Connected to postgres database")
    } catch (e) {
        console.log("Failed to connect to supabase", e);
    }
}

initializeDatabase();

module.exports = {
    supabase,
    pool
}
