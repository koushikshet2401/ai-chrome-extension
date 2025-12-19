chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["groqApiKey"], (result) => {
    if (!result.groqApiKey) {
      chrome.tabs.create({
        url: chrome.runtime.getURL("options.html"),
      });
    }
  });
});
