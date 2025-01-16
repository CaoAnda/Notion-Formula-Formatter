// background.js

chrome.commands.onCommand.addListener((command) => {
    if (command === "convert-formulas") {
      console.log("Command received in background:", command);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const activeTab = tabs[0];
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
              window.postMessage({ action: "convert-formulas" }, "*");
            }
          });
        }
      });
    }
  });
  