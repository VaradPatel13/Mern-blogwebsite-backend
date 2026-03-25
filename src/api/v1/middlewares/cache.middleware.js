import redis from "../../../config/redis.js";


export const redisCache = (duration = 3600) => async (req, res, next) => {
    if (!redis || req.method !== 'GET') {
        return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
        const cachedResponse = await redis.get(key);

        if (cachedResponse) {
            console.log(`Serving cached response for: ${key}`);
            return res.json(JSON.parse(cachedResponse));
        }

        res.originalJson = res.json;
        res.json = (body) => {
            if (res.statusCode === 200) {
                redis.set(key, JSON.stringify(body), "EX", duration)
                    .catch(err => console.error("❌ Failed to set Redis cache:", err));
            }
            return res.originalJson(body);
        };

        next();
    } catch (err) {
        console.error("Redis cache middleware error:", err);
        next();
    }
};

export const clearCache = (keyPattern) => {
    if (!redis) return;
    
    if (keyPattern.includes('*')) {
        redis.keys(keyPattern).then(keys => {
            if (keys.length > 0) redis.del(keys);
        });
    } else {
        redis.del(keyPattern);
    }
};
