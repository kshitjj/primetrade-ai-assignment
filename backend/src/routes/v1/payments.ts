import { Router, Response } from "express"
import Razorpay from "razorpay"
import crypto from "crypto"
import pool from "../../db"
import { authenticate, AuthRequest } from "../../middleware/auth"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string
})

const router = Router()

// POST create payment order
router.post("/create/:order_id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
      [req.params.order_id, req.user?.id]
    )

    if (!order.rows[0]) return res.status(404).json({ error: "Order not found" })
    if (order.rows[0].status !== "pending") {
      return res.status(400).json({ error: "Order is not pending" })
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.rows[0].total * 100), // razorpay expects paise
      currency: "INR",
      receipt: `order_${req.params.order_id}`
    })

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST verify payment
router.post("/verify", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body

    // verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" })
    }

    // update order status
    await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2",
      ["confirmed", order_id]
    )

    res.json({ message: "Payment verified, order confirmed" })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
