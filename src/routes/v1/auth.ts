import { Router, Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import pool from "../../db"
import { authLimiter } from "../../middleware/rateLimiter"

const router = Router()

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: kshitij@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *       400:
 *         description: Validation error or email already exists
 */
router.post("/register", authLimiter, async (req: Request, res: Response) => {
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


/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: kshitij@gmail.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */

router.post("/login", authLimiter, async (req: Request, res: Response) => {
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
