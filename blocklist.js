const input = document.getElementById("domainInput");
const addBtn = document.getElementById("addDomain");
const list = document.getElementById("domainList");
const clearBtn = document.getElementById("clearAll");
const backBtn = document.getElementById("back");

function render(domains) {
  list.innerHTML = "";
  domains.forEach((domain, index) => {
    const li = document.createElement("li");
    li.textContent = domain;
    const remove = document.createElement("button");
    remove.textContent = "Remove";
    remove.onclick = () => {
      domains.splice(index, 1);
      chrome.storage.local.set({ blocklist: domains });
      render(domains);
    };
    li.appendChild(remove);
    list.appendChild(li);
  });
}

chrome.storage.local.get({ blocklist: [] }, data => {   
  render(data.blocklist);
});

addBtn.onclick = () => {
  const value = input.value.trim();
  if (!value) return;
  chrome.storage.local.get({ blocklist: [] }, data => {
    const domains = [...data.blocklist, value];
    chrome.storage.local.set({ blocklist: domains });
    render(domains);
    input.value = "";
  });
};

clearBtn.onclick = () => {
  chrome.storage.local.set({ blocklist: [] });
  render([]);
};

backBtn.onclick = () => {
  chrome.action.setPopup({ popup: "popup.html" }, () => {
    chrome.action.openPopup();
  });
};
