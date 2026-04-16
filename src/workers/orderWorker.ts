import { Worker } from "bullmq"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const worker = new Worker("orders", async (job) => {
  const { email, orderId, total } = job.data
  console.log("Worker processing job:", job.data)

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order #${orderId} Confirmed`,
      text: `Your order #${orderId} has been placed successfully. Total: ₹${total}`
    })
    console.log("Email sent:", info.messageId)
  } catch (err) {
    console.error("Email error:", err)
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379
  }
})
export default worker
