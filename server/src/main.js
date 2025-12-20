// server/src/main.js
const { spawn } = require('child_process');
const path = require('path');

console.log("🚀 Starting SysPulse Monolith...");

// Start the API (Ingestor)
const api = spawn('node', [path.join(__dirname, 'ingestor.js')], { stdio: 'inherit' });

// Start the Worker
const worker = spawn('node', [path.join(__dirname, 'worker.js')], { stdio: 'inherit' });

// Handle crashes
api.on('close', (code) => {
    console.error(`API crashed with code ${code}`);
    process.exit(code); // Kill the container so Render restarts it
});

worker.on('close', (code) => {
    console.error(`Worker crashed with code ${code}`);
    process.exit(code);
});