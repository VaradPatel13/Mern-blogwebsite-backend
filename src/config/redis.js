import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

if (!redisUrl) {
    console.warn("REDIS_URL or UPSTASH_REDIS_URL not found in environment. Caching will be skipped.");
}

const redis = redisUrl ? new Redis(redisUrl, {
    tls: {
       rejectUnauthorized: false 
    }
}) : null;

if (redis) {
    redis.on("connect", () => console.log("Connected to Redis (Upstash)"));
    redis.on("error", (err) => console.log("Redis Connection Error:", err));
}

export default redis;
