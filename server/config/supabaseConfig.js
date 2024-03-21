const { createClient, createRole } = require('@supabase/supabase-js');
const { Pool } = require("pg");
let supabase;
let pool;


const initializeDatabase = async () => {
    try {
        const supabaseUrl = 'https://xjrhebmomygxcafbvlye.supabase.co'
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcmhlYm1vbXlneGNhZmJ2bHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA5NzkxNTUsImV4cCI6MjAyNjU1NTE1NX0.SmMkxD8GudmadPL5Lt83JwskZhszbDa4q6_WpbFUgdQ'
        supabase = createClient(supabaseUrl, supabaseKey)
        console.log("Connected to supabase")


        const host = "aws-0-ap-southeast-1.pooler.supabase.com"
        const databaseName = "postgres"
        const port = 5432
        const user = "postgres.xjrhebmomygxcafbvlye"
        const password = process.env.databasePassword

        pool = new Pool({
            user: user,
            host: host,
            database: databaseName,
            password: password,
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

        await pool.query(createGenderType);

        let createUserProfileTable = `CREATE TABLE IF NOT EXISTS tblUserProfile(
            id SERIAL PRIMARY KEY,
            userId VARCHAR,
            firstName VARCHAR(50), 
            lastName VARCHAR(50), 
            phoneNumber VARCHAR(50),
            address VARCHAR(255),
            gender gender,
            role VARCHAR,
            CONSTRAINT unique_userId UNIQUE (userId)
        )`;

        await pool.query(createUserProfileTable);

        let createDealershipTable = `CREATE TABLE IF NOT EXISTS tblDealership(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            manager VARCHAR,
            latitude DECIMAL(9, 6),
            longitude DECIMAL(9, 6),
            address VARCHAR(255),
            FOREIGN KEY (manager) REFERENCES tblUserProfile(userId)
        )`;

        await pool.query(createDealershipTable);

        let createDealerAgentApplicantTable = `CREATE TABLE IF NOT EXISTS tblDealershipAgentApplicant(
            id SERIAL PRIMARY KEY,
            userId VARCHAR NOT NULL,
            dealershipId INT NOT NULL,
            FOREIGN KEY (userId) REFERENCES tblUserProfile(userId) ON DELETE CASCADE,
            FOREIGN KEY (dealershipId) REFERENCES tblDealership(id) ON DELETE CASCADE
        )`;

        await pool.query(createDealerAgentApplicantTable);
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
