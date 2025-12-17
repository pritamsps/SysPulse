const axios = require('axios');

const URL = "http://localhost:3000/logs";
const TOTAL_REQUESTS = 100;

async function sendLog(i) {
    try {
        await axios.post(URL, {
            service: "load-tester",
            level: "INFO",
            message: `Stress test log #${i}`,
            timestamp: new Date().toISOString() // Optional, backend adds it if missing
        });
        // process.stdout.write("."); // Un-comment to see dots for progress
    } catch (err) {
        console.error(`Failed request #${i}`);
    }
}

async function runTest() {
    console.log(`Starting Load Test: ${TOTAL_REQUESTS} requests...`);
    const start = Date.now();

    const promises = [];
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        promises.push(sendLog(i));
    }

    await Promise.all(promises);
    
    const duration = (Date.now() - start) / 1000;
    console.log(`\nDone! Sent ${TOTAL_REQUESTS} logs in ${duration}s`);
}

runTest();