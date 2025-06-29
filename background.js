import { database, ref, onValue, get, set } from './firebase.js';
import { WHITELIST_URLS } from './whitelist.js';

const USER_ID = "aaryan"; // Change this to your user ID
const focusRef = ref(database, `/users/${USER_ID}/settings/focusMode`);

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

const distractionsRef = ref(database, `/users/${USER_ID}/distractions`);

get(distractionsRef).then(snapshot => {
  if (!snapshot.exists()) {
    console.log("Creating empty 'distractions' node...");
    set(distractionsRef, {});
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
    if (document.getElementById('focus-popup-iframe')) return;

    const iframe = document.createElement('iframe');
    iframe.id = 'focus-popup-iframe';
    iframe.src = chrome.runtime.getURL('popup.html');
    iframe.style = `
      position:fixed;top:0;left:0;width:100vw;height:100vh;
      border:none;z-index:999999999;background:transparent;
    `;
    document.body.appendChild(iframe);
  }
});
});

// Listen for closeTab messages
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "closeTab" && sender.tab && sender.tab.id) {
    chrome.tabs.remove(sender.tab.id);
  }
});
