import express from "express"
import twilio from "twilio"
import dotenv from "dotenv"
import cors from "cors"

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  process.env.TWILIO_TEST_AUTH_TOKEN,
  process.env.TWILIO_PHONE_NUMBER
)

const emailService = new EmailService()

// Send SMS
app.post("/send-sms", async (req, res) => {
  try {
    const { to, body } = req.body

    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    })

    console.log(message.body)

    res.status(200).json({
      success: true,
      sid: message.sid,
    })
  } catch (error) {
    console.error("SMS Send Error:", error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// Get all messages (temporary set limit to 5)
app.get("/messages", async (req, res) => {
  try {
    const messages = await client.messages.list({ limit: 5 })

    const formattedMessages = messages.map((message) => ({
      sid: message.sid,
      body: message.body,
      from: message.from,
      to: message.to,
      status: message.status,
      dateSent: message.dateSent,
    }))

    res.json(formattedMessages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    res.status(500).json({
      error: "Failed to retrieve messages",
      details: error.message,
    })
  }
})

// Send Email Endpoint
app.post("/api/send-email", async (req, res) => {
  try {
    const result = await emailService.sendEmail(req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Fetch Emails Endpoint
app.get("/api/emails", async (req, res) => {
  try {
    const emails = await emailService.fetchEmails()
    res.status(200).json(emails)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark Email as Read Endpoint
app.patch("/api/emails/:id/read", async (req, res) => {
  try {
    await emailService.markEmailAsRead(req.params.id)
    res.status(200).json({ message: "Email marked as read" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
