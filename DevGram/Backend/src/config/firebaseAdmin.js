import admin from 'firebase-admin'

let firebaseAdmin = null

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const hasValidKeys = process.env.FIREBASE_PROJECT_ID && 
                     !process.env.FIREBASE_PROJECT_ID.includes('mock') &&
                     privateKey && 
                     !privateKey.includes('MOCK_KEY')

if (hasValidKeys) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      })
    }
    firebaseAdmin = admin
    console.log('Firebase Admin SDK initialized successfully')
  } catch (error) {
    console.error('Firebase Admin SDK failed to initialize:', error.message)
  }
} else {
  console.warn('⚠️ Firebase Admin running in Developer Mock Mode (no valid credentials provided).')
}

export { firebaseAdmin }
