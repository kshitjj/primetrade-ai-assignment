import { Router, Response } from "express"
import pool from "../../db"
import { authenticate, AuthRequest } from "../../middleware/auth"

const router = Router()

// GET cart
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT ci.id, p.name, p.price, ci.quantity, 
     (p.price * ci.quantity) as subtotal
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = $1`,
    [req.user?.id]
  )
  const total = result.rows.reduce((sum, item) => sum + Number(item.subtotal), 0)
  res.json({ items: result.rows, total })
})

// POST add to cart
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const { product_id, quantity } = req.body
  const result = await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + $3
     RETURNING *`,
    [req.user?.id, product_id, quantity]
  )
  res.json(result.rows[0])
})

// DELETE remove from cart
router.delete("/:product_id", authenticate, async (req: AuthRequest, res: Response) => {
  await pool.query(
    "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2",
    [req.user?.id, req.params.product_id]
  )
  res.json({ message: "Removed from cart" })
})

export default router
