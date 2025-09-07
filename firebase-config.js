// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7Wkf7Xu6873kb82nqWdS_IVFvxC1TNQg",
  authDomain: "mirella-dd7ff.firebaseapp.com",
  databaseURL: "https://mirella-dd7ff-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mirella-dd7ff",
  storageBucket: "mirella-dd7ff.firebasestorage.app",
  messagingSenderId: "956779054403",
  appId: "1:956779054403:web:281b51588e4629b23ddbf6",
  measurementId: "G-RXWQS623VF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const database = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export for use in other files
window.db = database;
window.auth = auth;
window.storage = storage;

export { database, auth, storage };
