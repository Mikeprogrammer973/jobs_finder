"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCache = exports.getCache = void 0;
const redis_1 = require("redis");
const client = (0, redis_1.createClient)({
    socket: {
        host: "127.0.0.1",
        port: 6379,
    }
});
client.connect();
const getCache = async (key) => {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
};
exports.getCache = getCache;
const setCache = async (key, value, ttl = 3600) => {
    await client.setEx(key, ttl, JSON.stringify(value));
};
exports.setCache = setCache;
