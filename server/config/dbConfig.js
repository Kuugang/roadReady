const { initializeApp } = require("firebase/app")
const { getFirestore } = require("firebase/firestore/lite")
const dotenv = require("dotenv")
// Follow this pattern to import other Firebase services
// import { } from 'firebase/<service>';

// TODO: Replace the following with your app's Firebase project configuration
console.log(process.env.apiKey)
const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
};

let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.log(e.getMessage())
}
console.log("Connected to database");

module.exports = {
    db,
}
