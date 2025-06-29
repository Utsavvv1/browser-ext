import { database, ref, onValue, get, set } from './firebase.js';
import { WHITELIST_URLS } from './whitelist.js';

const USER_ID = "abc123"; // Change this to your user ID
const focusRef = ref(database, `/users/${USER_ID}/focusMode`);

let focusMode = false;

// Create focusMode = false if not exists
get(focusRef).then(snapshot => {
  if (!snapshot.exists()) {
    console.log("Creating focusMode = false...");
    set(focusRef, false);
  } else {
    focusMode = snapshot.val() === true;
    console.log("Focus mode loaded:", focusMode);
  }
});

// Listen for Firebase updates
onValue(focusRef, snapshot => {
  focusMode = snapshot.val() === true;
  console.log("Focus mode updated:", focusMode);
});

// Start polling tabs every 5 seconds to auto-toggle focusMode
setInterval(() => {
  chrome.tabs.query({}, tabs => {
    const anyWhitelisted = tabs.some(tab =>
      WHITELIST_URLS.some(site => tab.url && tab.url.includes(site))
    );

    if (anyWhitelisted && !focusMode) {
      console.log("Whitelist URL detected—enabling focusMode.");
      set(focusRef, true);
    }

    if (!anyWhitelisted && focusMode) {
      console.log("No whitelist URL detected—disabling focusMode.");
      set(focusRef, false);
    }
  });
}, 5000);

// On tab updates, inject overlay if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!focusMode || !tab.url || changeInfo.status !== "complete") return;

  // If the tab is a whitelist URL, do NOT block it
  const isWhitelisted = WHITELIST_URLS.some(site => tab.url.includes(site));
  if (isWhitelisted) return;

  // Otherwise, inject the blocking overlay
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const overlay = document.createElement("div");
      overlay.style = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.85);color:white;font-size:2em;
        display:flex;align-items:center;justify-content:center;
        z-index:999999999;
        font-family:sans-serif;`;

      const box = document.createElement("div");
      box.style = `
        background:#1e1e1e;padding:30px;border-radius:15px;
        text-align:center;max-width:90%;box-shadow:0 0 10px #000;
        border:2px solid #fff;`;

      const title = document.createElement("h2");
      title.textContent = "🔒 You're in Focus Mode";

      const msg = document.createElement("p");
      msg.textContent = "Stay productive!";

      const stopBtn = document.createElement("button");
      stopBtn.textContent = "✖ Close This Tab";
      stopBtn.style = `
        margin-top:20px;padding:10px 20px;
        background:red;color:white;font-size:16px;
        border:none;border-radius:10px;cursor:pointer;`;

      stopBtn.onclick = () => {
        chrome.runtime.sendMessage({ action: "closeTab" });
      };

      box.appendChild(title);
      box.appendChild(msg);
      box.appendChild(stopBtn);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }
  });
});

// Listen for closeTab messages
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "closeTab" && sender.tab && sender.tab.id) {
    chrome.tabs.remove(sender.tab.id);
  }
});
