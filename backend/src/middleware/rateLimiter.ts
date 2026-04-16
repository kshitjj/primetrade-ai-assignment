import rateLimit from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import redis from "../redis"

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // max 10 requests per 15 minutes
  message: { error: "Too many attempts, try again later" },
    store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) => 
      redis.call(command, ...args) as any
  })
})
