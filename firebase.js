import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  get,
  set
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { FIREBASE_CONFIG } from './env.js'; //Load env

const app = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(app);

export { database, ref, onValue, get, set };
