import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAJc53fIiOh0BFAq8_mQPhdVZvlBg5Oc6I",
  authDomain: "iosra-e1982.firebaseapp.com",
  projectId: "iosra-e1982",
  storageBucket: "iosra-e1982.firebasestorage.app",
  messagingSenderId: "273678798179",
  appId: "1:273678798179:web:ab0d0833f27be6c7b15756",
  measurementId: "G-4N143P4ZGW",
};

// Khởi tạo Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);