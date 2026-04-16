import { Queue } from "bullmq"
import redis from "../redis"

export const orderQueue = new Queue("orders", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379
  }
})
