// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWqZOPVBqWqH1CWEQPWWEZqOtdbhS-1N4",
  authDomain: "marketmate-16c7b.firebaseapp.com",
  projectId: "marketmate-16c7b",
  storageBucket: "marketmate-16c7b.firebasestorage.app",
  messagingSenderId: "47492785419",
  appId: "1:47492785419:web:7b2af06531acc2185a2e0e",
  measurementId: "G-R83KM78619"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default firebaseConfig;