import express from "express"
import twilio from "twilio"
import dotenv from "dotenv"
import cors from "cors"
import multer from "multer"
import GmailService from "./services/GmailService.js"

dotenv.config()

const PORT = process.env.PORT || 80

const app = express()
const storage = multer.memoryStorage()
const upload = multer({ storage })
const attachments = upload.array("attachments[]")

app.use(express.json())
app.use(cors())

const gmailService = new GmailService()
gmailService.execute()

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const twiml = new twilio.twiml.VoiceResponse()

app.get("/token", (req, res) => {
  const AccessToken = twilio.jwt.AccessToken
  const VoiceGrant = AccessToken.VoiceGrant
  const VideoGrant = AccessToken.VideoGrant

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_SID,
    process.env.TWILIO_API_SECRET_KEY,
    { identity: "client" }
  )

  const voiceGrant = new VoiceGrant({
    incomingAllow: true,
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
  })

  const videoGrant = new VideoGrant({
    room: "DailyStandupRoom",
  })

  token.addGrant(voiceGrant)
  token.addGrant(videoGrant)

  res.json({
    token: token.toJwt(),
  })
})

app.post("/outgoing-call", async (req, res) => {
  const { to, url } = req.body

  try {
    const call = await client.calls.create({
      to: `+63${to.slice(1)}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: url,
    })

    res.status(200).json({
      success: true,
      callsid: call.sid,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send("Failed to initiate call")
  }
})

app.post("/twiml", (req, res) => {
  twiml.dial().client("client")

  res.type("text/xml")
  res.send(twiml.toString())
})

app.post("/incoming-call", async (req, res) => {
  twiml.dial().client("client")

  res.type("text/xml")
  res.send(twiml.toString())
})

app.post("/send-sms", async (req, res) => {
  try {
    const { to, body } = req.body

    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    })

    console.log(message)

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

app.get("/inbox", async (req, res) => {
  try {
    const messages = await client.messages.list()

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

app.post("/send-email", attachments, async (req, res) => {
  try {
    const { to, subject, body } = req.body
    const attachmentFiles = req.files.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
    }))

    const emailData = {
      from: process.env.EMAIL,
      to: to,
      subject: subject,
      text: body,
      attachments: attachmentFiles,
    }

    const result = await gmailService.sendEmail(emailData)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
