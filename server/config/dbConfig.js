const { initializeApp } = require("firebase/app")
const { getFirestore } = require("firebase/firestore/lite")
// Follow this pattern to import other Firebase services
// import { } from 'firebase/<service>';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyC7f8AgBUb4HeFNMyfNHTut6q1iJbza2cM",
    authDomain: "roadready-42839.firebaseapp.com",
    projectId: "roadready-42839",
    storageBucket: "roadready-42839.appspot.com",
    messagingSenderId: "554777352222",
    appId: "1:554777352222:web:b1aaf51eb22e953ff0f60f",
    measurementId: "G-5KXL5SSZ3C"
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
