document.addEventListener("DOMContentLoaded", () => {
  const apiInput = document.getElementById("api-key");
  const saveBtn = document.getElementById("save-button");
  const successMessage = document.getElementById("success-message");

  // Load saved Groq API key
  chrome.storage.sync.get(["groqApiKey"], (result) => {
    if (result.groqApiKey) {
      apiInput.value = result.groqApiKey;
    }
  });

  // Save Groq API key
  saveBtn.addEventListener("click", () => {
    const apiKey = apiInput.value.trim();

    if (!apiKey) return;

    chrome.storage.sync.set({ groqApiKey: apiKey }, () => {
      successMessage.style.display = "block";

      setTimeout(() => {
        window.close();
      }, 800);
    });
  });
});
