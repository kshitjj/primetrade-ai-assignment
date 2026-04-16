import { Router, Response } from "express"
import pool from "../db"
import redis from "../redis"
import { authenticate, isAdmin, AuthRequest } from "../middleware/auth"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import s3 from "../s3"
import upload from "../middleware/upload"

const router = Router()

// GET all products - public
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    // check cache first
    const cached = await redis.get("products")
    if (cached) {
      return res.json(JSON.parse(cached))
    }

    // if not cached, hit the database
    const result = await pool.query("SELECT * FROM products")
    
    // store in cache for 60 seconds
    await redis.set("products", JSON.stringify(result.rows), "EX", 60)
    
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" })
  }
})

// GET single product - public
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const result = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id])
  if (!result.rows[0]) return res.status(404).json({ error: "Product not found" })
  res.json(result.rows[0])
})

// POST create product - admin only
router.post("/", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  const { name, description, price, stock, image_url } = req.body
  const result = await pool.query(
    "INSERT INTO products (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [name, description, price, stock, image_url]
  )
  await redis.del("products")
  res.json(result.rows[0])
})

// PUT update product - admin only
router.put("/:id", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  const { name, description, price, stock, image_url } = req.body
  const result = await pool.query(
    "UPDATE products SET name=$1, description=$2, price=$3, stock=$4, image_url=$5 WHERE id=$6 RETURNING *",
    [name, description, price, stock, image_url, req.params.id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: "Product not found" })
  await redis.del("products")
  res.json(result.rows[0])
})

// DELETE product - admin only
router.delete("/:id", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  await pool.query("DELETE FROM products WHERE id = $1", [req.params.id])
  await redis.del("products")
  res.json({ message: "Deleted" })
})

// POST upload product image - admin only
router.post("/:id/image", authenticate, isAdmin, upload.single("image"), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" })

    const key = `products/${req.params.id}-${Date.now()}`

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }))

    const image_url = `${process.env.AWS_ENDPOINT}/${process.env.AWS_BUCKET}/${key}`

    await pool.query(
      "UPDATE products SET image_url = $1 WHERE id = $2",
      [image_url, req.params.id]
    )

    res.json({ image_url })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
