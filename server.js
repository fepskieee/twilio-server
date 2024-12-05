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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
