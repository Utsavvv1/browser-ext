
const wlInput = document.getElementById("whitelistInput");
const wlAdd = document.getElementById("addWhitelist");
const wlList = document.getElementById("whitelistList");
const wlClear = document.getElementById("clearWhitelist");

const blInput = document.getElementById("blocklistInput");
const blAdd = document.getElementById("addBlocklist");
const blList = document.getElementById("blocklistList");
const blClear = document.getElementById("clearBlocklist");

// Tabs
const tabWhitelist = document.getElementById("tab-whitelist");
const tabBlocklist = document.getElementById("tab-blocklist");
const contentWhitelist = document.getElementById("content-whitelist");
const contentBlocklist = document.getElementById("content-blocklist");

tabWhitelist.onclick = () => {
  tabWhitelist.classList.add("active");
  tabBlocklist.classList.remove("active");
  contentWhitelist.classList.add("active");
  contentBlocklist.classList.remove("active");
};

tabBlocklist.onclick = () => {
  tabBlocklist.classList.add("active");
  tabWhitelist.classList.remove("active");
  contentBlocklist.classList.add("active");
  contentWhitelist.classList.remove("active");
};

// Render helpers
function render(listElement, items, storageKey) {
  listElement.innerHTML = "";
  items.forEach((domain, index) => {
    const li = document.createElement("li");
    li.textContent = domain;
    const remove = document.createElement("button");
    remove.textContent = "Remove";
    remove.onclick = () => {
      items.splice(index, 1);
      chrome.storage.local.set({ [storageKey]: items });
      render(listElement, items, storageKey);
    };
    li.appendChild(remove);
    listElement.appendChild(li);
  });
}

// Load initial data
chrome.storage.local.get({ whitelist: [], blocklist: [] }, (data) => {
  render(wlList, data.whitelist, "whitelist");
  render(blList, data.blocklist, "blocklist");
});

// Whitelist handlers
wlAdd.onclick = () => {
  const value = wlInput.value.trim();
  if (!value) return;
  chrome.storage.local.get({ whitelist: [] }, (data) => {
    const domains = [...data.whitelist, value];
    chrome.storage.local.set({ whitelist: domains });
    render(wlList, domains, "whitelist");
    wlInput.value = "";
  });
};

wlClear.onclick = () => {
  chrome.storage.local.set({ whitelist: [] });
  render(wlList, [], "whitelist");
};

// Blocklist handlers
blAdd.onclick = () => {
  const value = blInput.value.trim();
  if (!value) return;
  chrome.storage.local.get({ blocklist: [] }, (data) => {
    const domains = [...data.blocklist, value];
    chrome.storage.local.set({ blocklist: domains });
    render(blList, domains, "blocklist");
    blInput.value = "";
  });
};

blClear.onclick = () => {
  chrome.storage.local.set({ blocklist: [] });
  render(blList, [], "blocklist");
};
