require('dotenv').config();
const pool = require('./db');
const { connectRedis,client } = require("./config/redis");
 async function processLogs(logData) {
    try{
        const query = 'INSERT INTO logs(service, level, message, timestamp) VALUES($1, $2, $3, NOW()) Returning id';
    
        const values = [logData.service, logData.level, logData.message];
        const res = await pool.query(query, values);
        console.log(`Log saved with ID: ${res.rows[0].id}`);
    }catch(err){
        console.error("Error saving log to DB:", err);
    }
}
let isRunning=true;
process.on('SIGINT', () => {
    console.log("\nReceived stop signal. Finishing current task...");
    isRunning = false;
});
async function startWorker() {
    await connectRedis();
    console.log("Worker connected to Redis, waiting for logs...");
    while (isRunning) {
        try{
            const result=await client.blPop("logs",2);
            if(!result) continue;
            const logData=JSON.parse(result.element);
            await processLogs(logData);
        }catch(err){
            console.error("Error processing log:", err);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    console.log("Worker shutting down gracefully.");
    process.exit(0);
}
startWorker();
