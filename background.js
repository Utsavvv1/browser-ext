import { database, ref, onValue, get, set } from './firebase.js';

// Function to generate a 16-character hash
function generateUserId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Function to get or create user ID
function getUserId(callback) {
  chrome.storage.local.get({ userId: null }, (data) => {
    if (data.userId) {
      callback(data.userId);
    } else {
      const newUserId = generateUserId();
      chrome.storage.local.set({ userId: newUserId }, () => {
        callback(newUserId);
      });
    }
  });
}

let focusMode = false;
let whitelist = [];
let blocklist = [];

// Initialize focusMode and distractions using dynamic user ID
getUserId((USER_ID) => {
  const focusRef = ref(database, `/users/${USER_ID}/settings/focusMode`);
  const distractionsRef = ref(database, `/users/${USER_ID}/distractions`);

  // Initialize focusMode
  get(focusRef).then(snapshot => {
    if (!snapshot.exists()) {
      console.log("Creating focusMode = false...");
      set(focusRef, false);
    } else {
      focusMode = snapshot.val() === true;
      console.log("Focus mode loaded:", focusMode);
    }
  });

  // Initialize distractions node
  get(distractionsRef).then(snapshot => {
    if (!snapshot.exists()) {
      console.log("Creating empty 'distractions' node...");
      set(distractionsRef, {});
    }
  });

  // Listen for Firebase focusMode updates
  onValue(focusRef, snapshot => {
    focusMode = snapshot.val() === true;
    console.log("Focus mode updated:", focusMode);
  });
});

// Load whitelist and blocklist from storage
chrome.storage.local.get({ whitelist: [], blocklist: [] }, (data) => {
  whitelist = data.whitelist;
  blocklist = data.blocklist;
  console.log("Loaded whitelist:", whitelist);
  console.log("Loaded blocklist:", blocklist);
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.whitelist) {
    whitelist = changes.whitelist.newValue || [];
    console.log("Whitelist updated:", whitelist);
  }
  if (changes.blocklist) {
    blocklist = changes.blocklist.newValue || [];
    console.log("Blocklist updated:", blocklist);
  }
});

// Auto-toggle focusMode based on whitelist
setInterval(() => {
  chrome.tabs.query({}, tabs => {
    const anyWhitelisted = tabs.some(tab =>
      whitelist.some(site => tab.url && tab.url.includes(site))
    );

    if (anyWhitelisted && !focusMode) {
      console.log("Whitelist URL detected—enabling focusMode.");
      getUserId((USER_ID) => {
        set(ref(database, `/users/${USER_ID}/settings/focusMode`), true);
      });
    }

    if (!anyWhitelisted && focusMode) {
      console.log("No whitelist URL detected—disabling focusMode.");
      getUserId((USER_ID) => {
        set(ref(database, `/users/${USER_ID}/settings/focusMode`), false);
      });
    }
  });
}, 5000);

// On tab updates, block if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!focusMode || !tab.url || changeInfo.status !== "complete") return;

  const isWhitelisted = whitelist.some(site => tab.url.includes(site));
  if (isWhitelisted) return;

  const isBlocklisted = blocklist.some(site => tab.url.includes(site));
  if (isBlocklisted) {
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
  }
});

// Listen for closeTab messages
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "closeTab" && sender.tab && sender.tab.id) {
    chrome.tabs.remove(sender.tab.id);
  }
});

// Context menu entries for managing lists
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openWhitelist",
    title: "Manage Whitelist Domains",
    contexts: ["action"]
  });
  chrome.contextMenus.create({
    id: "openBlocklist",
    title: "Manage Blocklist Domains",
    contexts: ["action"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "openWhitelist") {
    chrome.tabs.create({ url: chrome.runtime.getURL("whitelist.html") });
  }
  if (info.menuItemId === "openBlocklist") {
    chrome.tabs.create({ url: chrome.runtime.getURL("blocklist.html") });
  }
});