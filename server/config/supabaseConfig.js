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
                CREATE TYPE role AS ENUM('admin', 'buyer', 'dealershipManager', 'dealershipAgent', 'dealershipAgentApplicant', 'bankAgent');
            END IF;
        END $$;
        `;

        await pool.query(createRoleType);
        await pool.query(createGenderType);

        let createUserProfileTable = `CREATE TABLE IF NOT EXISTS tblUserProfile(
            id SERIAL PRIMARY KEY,
            userId VARCHAR NOT NULL,
            firstName VARCHAR(50) NOT NULL, 
            lastName VARCHAR(50) NOT NULL, 
            phoneNumber VARCHAR(50),
            address VARCHAR(255),
            gender gender,
            role role NOT NULL,
            CONSTRAINT unique_userId UNIQUE (userId)
        )`;

        await pool.query(createUserProfileTable);

        let createDealershipTable = `CREATE TABLE IF NOT EXISTS tblDealership(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            manager VARCHAR,
            latitude DECIMAL(9, 6) NOT NULL,
            longitude DECIMAL(9, 6) NOT NULL,
            address VARCHAR(255) NOT NULL,
            FOREIGN KEY (manager) REFERENCES tblUserProfile(userId)
        )`;

        await pool.query(createDealershipTable);

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
