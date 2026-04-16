import { Router, Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import pool from "../../db"
import { authLimiter } from "../../middleware/rateLimiter"
import { registrationValidation, loginValidation } from '../../middleware/validation'

const router = Router()

// add middleware for sanization and validation
router.post("/register", authLimiter, registrationValidation, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const hashed = await bcrypt.hash(password, 10)
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role",
      [email, hashed]
    )
    res.json(result.rows[0])
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Email already exists" })
    }
  }
})


router.post("/login", authLimiter, loginValidation, async (req: Request, res: Response) => {
  const { email, password } = req.body
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])
  const user = result.rows[0]
  if (!user) return res.status(400).json({ error: "User not found" })

  const match = await bcrypt.compare(password, user.password)
  if (!match) return res.status(400).json({ error: "Wrong password" })

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string
  )
  res.json({ token })
})

export default router
