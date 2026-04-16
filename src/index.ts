import dotenv from "dotenv"
dotenv.config()

import express from "express"
import pool from "./db"
import authRouter from "./routes/auth"
import productsRouter from "./routes/products"
import ordersRouter from "./routes/orders"
import cartRouter from "./routes/cart"
import paymentsRouter from "./routes/payments"

import "./workers/orderWorker"

const app = express()
app.use(express.json())

app.get("/", async (req, res) => {
	const result = await pool.query("SELECT NOW()")
	res.json(result.rows[0])
})

app.use("/auth", authRouter)
app.use("/products", productsRouter)
app.use("/orders", ordersRouter)
app.use("/cart", cartRouter)
app.use("/payments", paymentsRouter)

app.listen(3000, () => console.log("Running on port 3000"))
