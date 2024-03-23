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
            phoneNumber VARCHAR(50),
            address VARCHAR(255),
            gender gender,
            role role NOT NULL,

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
            userId UUID PRIMARY KEY,
            dealership UUID NOT NULL,
            isAuthorized BOOL DEFAULT FALSE,

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMPTZ,

            FOREIGN KEY(userId) REFERENCES tblUserProfile(id),
            FOREIGN KEY(dealership) REFERENCES tblDealership(id)
        )`;

        await pool.query(createDealershipAgentTable);

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

            createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMPTZ,

            FOREIGN KEY (dealership) REFERENCES tblDealership(id),
            FOREIGN KEY (dealershipAgent) REFERENCES tblUserProfile(id)
        );`

        await pool.query(createListingTable);

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
