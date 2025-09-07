// Firebase configuration using compat version
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
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const database = firebase.database();
const auth = firebase.auth();
// Rimuovi storage per ora se non necessario
// const storage = firebase.storage();

// Make available globally
window.db = database;
window.auth = auth;
// window.storage = storage;
