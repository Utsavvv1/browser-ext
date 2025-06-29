import { database, ref, onValue, set, get } from './firebase.js';
import { BLOCKED_SITES } from './blocklist.js';

const USER_ID = "abc123"; // Set your Firebase user_id here
const focusRef = ref(database, `/users/${USER_ID}/focusMode`);
let focusMode = false;

// Step 1: Check if focusMode exists. If not, initialize to false.
get(focusRef).then(snapshot => {
  if (!snapshot.exists()) {
    console.log("No focusMode found in DB. Creating default entry...");
    set(focusRef, false);
  } else {
    focusMode = snapshot.val() === true;
    console.log("Focus mode loaded:", focusMode);
  }
});

// Step 2: Listen for realtime changes
onValue(focusRef, (snapshot) => {
  focusMode = snapshot.val() === true;
  console.log("Focus mode updated:", focusMode);
});

// Step 3: Watch tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!focusMode || !tab.url || changeInfo.status !== "complete") return;

  const isBlocked = BLOCKED_SITES.some(site => tab.url.includes(site));
  if (isBlocked) {
      chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Fullscreen overlay
          const overlay = document.createElement("div");
          overlay.id = "focus-overlay";
          overlay.style = `
            position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.8);color:white;z-index:999999999;
            display:flex;align-items:center;justify-content:center;
            font-family:sans-serif;`;

          // Center popup box
          const box = document.createElement("div");
          box.style = `
            background:#1e1e1e;padding:30px;border-radius:15px;
            text-align:center;max-width:90%;box-shadow:0 0 10px #000;
            border: 2px solid #fff;`;

          const title = document.createElement("h2");
          title.textContent = "🔒 You're in Focus Mode";

          const msg = document.createElement("p");
          msg.textContent = "🚀 Stay on track!";

          const closeBtn = document.createElement("button");
          closeBtn.textContent = "✖ Close YouTube";
          closeBtn.style = `
            margin-top:20px;padding:10px 20px;
            background:red;color:white;font-size:16px;
            border:none;border-radius:10px;cursor:pointer;
          `;

          closeBtn.onclick = () => {
            window.close(); // Try to close tab
          };

          box.appendChild(title);
          box.appendChild(msg);
          box.appendChild(closeBtn);
          overlay.appendChild(box);
          document.body.appendChild(overlay);
        }
    });
  }
});
