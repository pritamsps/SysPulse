const express = require("express");
const { connectRedis, client } = require("./config/redis");
const { getLogs, postLog } = require("./controllers/logController");
require('dotenv').config();
const pool = require('./db');

const app = express();

// Manual CORS middleware - MUST be FIRST
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

app.use(express.json());

const ALLOWED_LEVELS = ['INFO', 'WARN', 'ERROR', 'FATAL', 'DEBUG'];

connectRedis();

// Routes
app.post("/logs", postLog);
app.get("/logs", getLogs);

// Test route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'SysPulse backend is running with CORS'
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`✓ SysPulse running on port ${process.env.PORT || 3000}`);
    console.log(`✓ Manual CORS enabled`);
});