import { firestore } from "../firebaseConfig.js"
import nodemailer from "nodemailer"

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  }

  async sendEmail(emailData) {
    try {
      // Send email
      await this.transporter.sendMail({
        from: process.env.EMAIL,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.body,
      })

      // Save to Firestore
      const emailCollection = firestore.collection("emails")
      const docRef = await emailCollection.add({
        ...emailData,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        isRead: false,
      })

      return docRef
    } catch (error) {
      console.error("Email send error:", error)
      throw error
    }
  }

  async fetchEmails() {
    try {
      const emailCollection = firestore.collection("emails")
      const snapshot = await emailCollection.orderBy("sentAt", "desc").get()

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Fetch emails error:", error)
      throw error
    }
  }

  async markEmailAsRead(emailId) {
    try {
      const emailDoc = firestore.collection("emails").doc(emailId)
      await emailDoc.update({ isRead: true })
      return true
    } catch (error) {
      console.error("Mark as read error:", error)
      throw error
    }
  }
}

export default EmailService
