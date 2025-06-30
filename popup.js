document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('userInput');
  const exitButton = document.querySelector('.exit-button');

  function handleExit() {
    const reason = input.value.trim();
    if (!reason) return;

    // Save the reason to local storage
    chrome.storage.local.get({ distractionLogs: [] }, (data) => {
      const logs = data.distractionLogs;
      logs.push({
        reason,
        timestamp: new Date().toISOString()
      });
      chrome.storage.local.set({ distractionLogs: logs }, () => {
        console.log("✅ Reason saved to logs:", reason);  
      });
    });

    // Close the tab
    chrome.runtime.sendMessage({ action: "closeTab" });
  }

  // Handle Enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
      handleExit();
    }
  });

  // Handle click on EXIT button
  exitButton.addEventListener('click', handleExit);
});
