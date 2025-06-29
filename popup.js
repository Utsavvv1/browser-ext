document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.exit-button').addEventListener('click', () => {
    const reason = document.getElementById('userInput').value;
    console.log("🚪 User reason:", reason);
    chrome.runtime.sendMessage({ action: "closeTab" });
  });
});
