require('dotenv').config();
const pool = require('./db');
const { connectRedis,client } = require("./config/redis");

const BATCH_SIZE = 10;
const TIME_LIMIT=5000; // 5 seconds

let buffer=[];
let lastFlushTime=Date.now();
let isRunning=true;
async function flushBuffer(){
    if(buffer.length===0) return;
    const logsToInsert=[...buffer];
    buffer=[];
    lastFlushTime=Date.now();
    try{
        const values=[];
        const placeholders=logsToInsert.map((log,i)=>{
            const offset=i*4;
            values.push(log.service, log.level, log.message, log.timestamp);
            return `($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4})`;
        }).join(", ");
        const query=`INSERT INTO logs (service, level, message, timestamp) VALUES ${placeholders}`;
        await pool.query(query, values);
        console.log(`Inserted ${logsToInsert.length} logs into database.`);
    }catch(err){
        console.error("Error inserting logs into DB:", err);
        buffer.unshift(...logsToInsert);
    }
}
/***
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
process.on('SIGINT', () => {
    console.log("\nReceived stop signal. Finishing current task...");
    isRunning = false;
});***/
async function startWorker() {
    await connectRedis();
    console.log("Worker connected to Redis, waiting for logs...");
    while (isRunning) {
        try{
            /**const result=await client.blPop("logs",2);
            if(!result) continue;
            const logData=JSON.parse(result.element);
            await processLogs(logData);**/
            const timeSinceLastFlush=Date.now()-lastFlushTime;
            if(buffer.length>=BATCH_SIZE || (buffer.length>0 && timeSinceLastFlush>=TIME_LIMIT)){
                await flushBuffer();
            }
            if(buffer.length<BATCH_SIZE){
                const result=await client.lPop("logs");
                if(result){
                    buffer.push(JSON.parse(result));
                }else{
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }catch(err){
            console.error("Worker loop error:", err);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    console.log("Worker shutting down gracefully.");
    process.exit(0);
}
async function insertLog(logData) {
    const query = `
        INSERT INTO logs (service, level, message, metadata, timestamp) 
        VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [logData.service, logData.level, logData.message,logData.meta, logData.timestamp];
    await pool.query(query, values);
}

//Graceful Shutdown
process.on('SIGINT', async () => {
    console.log("\nReceived stop signal. Flushing remaining logs...");
    isRunning = false;
    await flushBuffer(); // Save whatever is left in buffer
    console.log("Worker shut down.");
    process.exit(0);
});

startWorker();
