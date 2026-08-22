const { createClient } = require('redis'),
    redisClient = createClient({ url: process.env.REDIS_URL, });
redisClient.on('error', (err) => console.error('Redis client error:', err));

async function connectRedis() {
    await redisClient.connect();
}

async function pingRedis() {
    try {
        const reply = await redisClient.ping();
        return reply === 'PONG';
    } catch (err) {
        console.error('Redis ping failed:', err);
        return false;
    }
}

module.exports = {
    redisClient,
    connectRedis,
    pingRedis,
};