const input = document.getElementById("domainInput");
const addButton = document.getElementById("addButton");
const list = document.getElementById("domainList");

function refreshList() {
  chrome.storage.local.get({ whitelist: [] }, (data) => {
    list.innerHTML = "";
    data.whitelist.forEach((domain, index) => {
      const li = document.createElement("li");
      li.textContent = domain;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";

      removeBtn.addEventListener("click", () => {
        data.whitelist.splice(index, 1);
        chrome.storage.local.set({ whitelist: data.whitelist }, refreshList);
      });

      li.appendChild(removeBtn);
      list.appendChild(li);
    });
  });
}

addButton.addEventListener("click", () => {
  const domain = input.value.trim();
  if (!domain) return;
  chrome.storage.local.get({ whitelist: [] }, (data) => {
    if (!data.whitelist.includes(domain)) {
      data.whitelist.push(domain);
      chrome.storage.local.set({ whitelist: data.whitelist }, () => {
        input.value = "";
        refreshList();
      });
    }
  });
});

// Initialize
refreshList();
