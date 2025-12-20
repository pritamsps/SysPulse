const { Pool } = require('pg');
require('dotenv').config();

const getPoolConfig = () => {
    if (process.env.DATABASE_URL) {
        console.log("🔌 Connecting to Cloud Database...");
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        };
    }

 
    console.log("🔌 Connecting to Local Database...");
    return {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    };
};

const pool = new Pool(getPoolConfig());

module.exports = pool;