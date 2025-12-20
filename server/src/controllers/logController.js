const { client } = require('../config/redis');
const pool = require('../db');
const ALLOWED_LEVELS = ['INFO', 'WARN', 'ERROR', 'FATAL', 'DEBUG'];
const postLog = async (req, res) => {
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
};
 const getLogs = async (req, res) => {
    try {
        const { level, search, startDate, endDate } = req.query;
        
        let sq = "SELECT * FROM logs"; // Base query
        const conditions = [];
        const values = [];

        // 1. Build Conditions
        if (level) {
            values.push(level);
            conditions.push(`level = $${values.length}`);
        }
        if (search) {
            values.push(`%${search}%`);
            conditions.push(`message ILIKE $${values.length}`);
        }
        if (startDate) {
            values.push(startDate);
            conditions.push(`"timestamp" >= $${values.length}`);
        }
        if (endDate) {
            values.push(endDate);
            conditions.push(`"timestamp" <= $${values.length}`);
        }

        // 2. Append WHERE clause if conditions exist
        if (conditions.length > 0) {
            sq += " WHERE " + conditions.join(" AND ");
        }

        // 3. Append ORDER BY (with a leading space!)
        sq += " ORDER BY \"timestamp\" DESC LIMIT 50";

        const result = await pool.query(sq, values);
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {postLog, getLogs};