import { createClient } from "redis"

const client = createClient({
    socket: {
        host: "127.0.0.1",
        port: 6379,
    }
})

client.connect()

export const getCache = async (key: string) => {
    const data =  await client.get(key)
    return data ? JSON.parse(data) : null
}

export const setCache = async (key: string, value: any, ttl = 3600) => {
    await client.setEx(key, ttl, JSON.stringify(value))
}