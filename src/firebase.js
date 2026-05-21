// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDEQEuxU7zrF4qXhIvcwQfmWgeZc_1Fcdg",
  authDomain: "bioexodus-4630b.firebaseapp.com",
  projectId: "bioexodus-4630b",
  storageBucket: "bioexodus-4630b.firebasestorage.app",
  messagingSenderId: "627303108704",
  appId: "1:627303108704:web:8af9b3094d453ec5e6f305",
  measurementId: "G-4WZP1YZLKD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, analytics, auth, provider, db };
