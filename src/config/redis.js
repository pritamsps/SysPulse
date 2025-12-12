const {createClient}= require('redis');
require('dotenv').config();
const client = createClient({url: process.env.REDIS_URL});
client.on('error', (err) => console.log('Redis Client Error', err));
async function connectRedis() {
    if (!client.isOpen) {
        await client.connect();
        console.log('Redis client connected');
    }
    return client;
}
module.exports = {client, connectRedis};