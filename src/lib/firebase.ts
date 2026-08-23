import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBCDm2B4jkFJ-B62aOpVar9uxXlVxT3QDQ",
  authDomain: "yniemdienanh-fb0b7.firebaseapp.com",
  projectId: "yniemdienanh-fb0b7",
  appId: "1:69246326577:web:50fb1d9cab97e7543fc210"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };
