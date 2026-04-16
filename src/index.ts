import dotenv from "dotenv"
dotenv.config()

import express from "express"
import pool from "./db"

// V1 routes
import v1AuthRouter from "./routes/v1/auth"
import v1ProductsRouter from "./routes/v1/products"
import v1OrdersRouter from "./routes/v1/orders"
import v1CartRouter from "./routes/v1/cart"
import v1PaymentsRouter from "./routes/v1/payments"

import "./workers/orderWorker"

const app = express()
app.use(express.json())

app.get("/", async (req, res) => {
	const result = await pool.query("SELECT NOW()")
	res.json(result.rows[0])
})

app.use("/api/v1/auth", v1AuthRouter)
app.use("/api/v1/products", v1ProductsRouter)
app.use("/api/v1/orders", v1OrdersRouter)
app.use("/api/v1/cart", v1CartRouter)
app.use("/api/v1/payments", v1PaymentsRouter)

app.listen(3000, () => console.log("Running on port 3000"))
