const express = require("express");
const { connectRedis,client } = require("./config/redis");
require('dotenv').config();

const app = express();
app.use(express.json());

const ALLOWED_LEVELS = ['INFO', 'WARN', 'ERROR', 'FATAL', 'DEBUG'];

connectRedis();
app.post("/logs", async (req, res) => {
    const logData = req.body;
    if(!logData.service|| !logData.level || !logData.message){
        return res.status(400).json({ error: "Missing required log fields" });
    }
    if(!ALLOWED_LEVELS.includes(logData.level)){
        return res.status(400).json({ error: "Invalid log level. Allowed : INFO, WARN, ERROR, FATAL, DEBUG" });
    }
    const payload={
        ...logData, timestamp: new Date().toISOString()
    };
    try{
        await client.rPush("logs", JSON.stringify(payload));
        res.status(200).json({ status:"Accepted",message: "Log ingested successfully" });
    }catch(err){
        console.error("Error ingesting log:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.listen(process.env.PORT, () => {
    console.log("SysPulse Ingestor service running on port 3000");
});