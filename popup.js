
// POPUP READY

document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("summarize");
  const copyBtn = document.getElementById("copy-btn");
  const resultDiv = document.getElementById("result");

  runBtn.addEventListener("click", handleAI);
  copyBtn.addEventListener("click", copyResult);
});



// MAIN HANDLER

async function handleAI() {
  const resultDiv = document.getElementById("result");
  const askAI = document.getElementById("ask-ai").value.trim();
  const summaryType = document.getElementById("summary-type").value;

  resultDiv.innerHTML = `
    <div class="loading">
      <div class="loader"></div>
    </div>
  `;

  chrome.storage.sync.get(["groqApiKey"], async ({ groqApiKey }) => {
    if (!groqApiKey) {
      resultDiv.innerText = "❌ API key not found. Please set it in Options.";
      return;
    }

    // If Ask AI text exists → direct answer
    if (askAI.length > 2) {
      const reply = await callGroq(askAI, groqApiKey);
      resultDiv.innerText = reply;
      return;
    }

    // Else summarize page
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return (resultDiv.innerText = "❌ No active tab found");

      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_ARTICLE_TEXT" },
        async (res) => {
          if (!res || !res.text || res.text.length < 50) {
            resultDiv.innerText = "❌ Could not extract article text.";
            return;
          }

          const prompt = buildSummaryPrompt(res.text, summaryType);
          const reply = await callGroq(prompt, groqApiKey);
          resultDiv.innerText = reply;
        }
      );
    });
  });
}



// BUILD SUMMARY PROMPT

function buildSummaryPrompt(text, type) {
  const max = 8000;
  const t = text.length > max ? text.slice(0, max) : text;

  if (type === "brief")
    return `Give a short 3 sentence summary:\n\n${t}`;

  if (type === "detailed")
    return `Give a detailed explanation summary:\n\n${t}`;

  return `Summarize in 5 - 7 bullet points:\n\n${t}`;
}



// CALL GROQ + AUTO RETRY

async function callGroq(prompt, apiKey) {
  const resultDiv = document.getElementById("result");

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 600,
          }),
        }
      );

      if (res.status === 429) {
        const wait = attempt * 3000;
        resultDiv.innerText = `⏳ Rate limit… retrying in ${wait / 1000}s`;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      return data?.choices?.[0]?.message?.content || "No response.";
    } catch (err) {
      console.log("Groq Error:", err);
    }
  }

  return " Failed after retries. Try again.";
}



// COPY RESULT

function copyResult() {
  const text = document.getElementById("result").innerText;
  if (!text.trim()) return;

  navigator.clipboard.writeText(text);
  const btn = document.getElementById("copy-btn");
  btn.innerText = "Copied!";
  setTimeout(() => (btn.innerText = "Copy"), 1500);
}
