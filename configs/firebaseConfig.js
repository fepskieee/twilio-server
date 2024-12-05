import admin from "firebase-admin"

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
const firebaseDatabaseURL = JSON.parse(process.env.FIREBASE_DB_URL)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseDatabaseURL,
})

export const firestore = admin.firestore()
