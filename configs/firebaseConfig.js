import admin from "firebase-admin"
import serviceAccountKey from "../serviceAccountKey.json" with { type: "json" }

const serviceAccount = serviceAccountKey
const firebaseDatabaseURL = process.env.FIREBASE_DB_URL

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseDatabaseURL,
})

export const firebaseAdmin = admin
export const firebaseDB = admin.firestore()
