import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD5DDcseBRnrF0UvvnmKbeTldO6rC5EP-c",
  authDomain: "zion-messenger-ba438.firebaseapp.com",
  databaseURL: "https://zion-messenger-ba438-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "zion-messenger-ba438",
  storageBucket: "zion-messenger-ba438.firebasestorage.app",
  messagingSenderId: "562284466036",
  appId: "1:562284466036:web:305d584099297d4f95a621"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);