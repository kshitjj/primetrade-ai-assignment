import { Router, Response } from "express"
import pool from "../db"
import { authenticate, AuthRequest, isAdmin } from "../middleware/auth"
import { orderQueue } from "../queues/orderQueue"

const router = Router()

// POST place an order
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    // get items from cart
    const cartResult = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [req.user?.id]
    )

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: "Cart is empty" })
    }

    let total = 0

    for (const item of cartResult.rows) {
      if (item.stock < item.quantity) {
        throw new Error(`Not enough stock for ${item.name}`)
      }
      total += item.price * item.quantity
    }

    // create order
    const order = await client.query(
      "INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *",
      [req.user?.id, total]
    )

    // insert order items and deduct stock
    for (const item of cartResult.rows) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [order.rows[0].id, item.product_id, item.quantity, item.price]
      )

      await client.query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2",
        [item.quantity, item.product_id]
      )
    }

    // clear cart
    await client.query(
      "DELETE FROM cart_items WHERE user_id = $1",
      [req.user?.id]
    )

    await client.query("COMMIT")

    // send confirmation email
    await orderQueue.add("send-confirmation", {
      email: req.user?.email,
      orderId: order.rows[0].id,
      total
    })

    res.json(order.rows[0])

  } catch (err: any) {
    await client.query("ROLLBACK")
    res.status(400).json({ error: err.message })
  } finally {
    client.release()
  }
})

// GET user's orders
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    "SELECT * FROM orders WHERE user_id = $1",
    [req.user?.id]
  )
  res.json(result.rows)
})

// GET single order with items
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const order = await pool.query(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user?.id]
  )
  if (!order.rows[0]) return res.status(404).json({ error: "Order not found" })

  const items = await pool.query(
    "SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1",
    [req.params.id]
  )

  res.json({ ...order.rows[0], items: items.rows })
})

// PUT update order status - admin only
router.put("/:id/status", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  const { status } = req.body
  const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` })
  }

  const result = await pool.query(
    "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  )

  if (!result.rows[0]) return res.status(404).json({ error: "Order not found" })
  res.json(result.rows[0])
})

// PUT cancel order - user can cancel their own pending order
router.put("/:id/cancel", authenticate, async (req: AuthRequest, res: Response) => {
  const order = await pool.query(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user?.id]
  )

  if (!order.rows[0]) return res.status(404).json({ error: "Order not found" })
  if (order.rows[0].status !== "pending") {
    return res.status(400).json({ error: "Only pending orders can be cancelled" })
  }

  // restore stock
  const items = await pool.query(
    "SELECT * FROM order_items WHERE order_id = $1",
    [req.params.id]
  )

  for (const item of items.rows) {
    await pool.query(
      "UPDATE products SET stock = stock + $1 WHERE id = $2",
      [item.quantity, item.product_id]
    )
  }

  const result = await pool.query(
    "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
    ["cancelled", req.params.id]
  )

  res.json(result.rows[0])
})



export default router
