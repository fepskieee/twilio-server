// import { firebaseAdmin, firebaseDB } from "../configs/firebaseConfig.js"
import fs from "fs/promises"
import path from "path"
import process from "process"
import nodemailer from "nodemailer"
import { google } from "googleapis"
import { authenticate } from "@google-cloud/local-auth"

class GmailService {
  constructor() {
    this.gmail = null
    this.auth = null
    this.SCOPES = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://mail.google.com/",
      "https://www.googleapis.com/auth/gmail.send",
    ]
    this.TOKEN_PATH = path.join(process.cwd(), "token.json")
    this.CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json")

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASS,
      },
    })
  }

  async sendEmail(emailData) {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.body,
      })

      return {
        status: "success",
        message: "Email is sent.",
      }
    } catch (error) {
      console.error("Email send error:", error)
      throw error
    }
  }

  async loadSavedCredentialsIfExist() {
    try {
      const content = await fs.readFile(this.TOKEN_PATH, "utf8")
      const credentials = JSON.parse(content)
      return google.auth.fromJSON(credentials)
    } catch (err) {
      return null
    }
  }

  async saveCredentials(client) {
    const content = await fs.readFile(this.CREDENTIALS_PATH, "utf8")
    const keys = JSON.parse(content)
    const key = keys.installed || keys.web
    const payload = JSON.stringify({
      type: "authorized_user",
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    })
    await fs.writeFile(this.TOKEN_PATH, payload)
  }

  async authorize() {
    let client = await this.loadSavedCredentialsIfExist()
    if (client) {
      return client
    }
    client = await authenticate({
      scopes: this.SCOPES,
      keyfilePath: this.CREDENTIALS_PATH,
    })
    if (client.credentials) {
      await this.saveCredentials(client)
    }
    return client
  }

  async listLabels(auth) {
    try {
      this.gmail = google.gmail({ version: "v1", auth })
      const res = await this.gmail.users.messages.list({
        userId: "me",
        maxResults: 10,
      })

      const messages = res.data.messages

      if (!messages || messages.length === 0) {
        console.log("No emails found.")
        return
      }

      const emails = await Promise.all(
        res.data.messages.map(async (message) => {
          const email = await this.gmail.users.messages.get({
            userId: "me",
            id: message.id,
          })
          return email.data
        })
      )

      return emails
    } catch (error) {
      console.error("Error retrieving emails:", error)
    }
  }

  async execute() {
    console.log("execute(): Gmail Service started...")
    try {
      this.auth = await this.authorize()
      await this.listLabels(this.auth)
    } catch (error) {
      console.error(error)
    }
  }
}

export default GmailService
