console.log("✅ Content script active:", location.href);

function isVisible(el) {
  return !!(
    el.offsetWidth ||
    el.offsetHeight ||
    el.getClientRects().length
  );
}

function getArticleText() {
  //  Selected text (highest priority)
  const selection = window.getSelection().toString().trim();
  if (selection.length > 20) {
    return selection;
  }

  //  Wikipedia-specific extraction
  const wiki = document.querySelector("#mw-content-text");
  if (wiki) {
    const ps = Array.from(wiki.querySelectorAll("p"))
      .filter(p => isVisible(p))
      .map(p => p.innerText.trim())
      .filter(p => p.length > 40);

    const text = ps.join("\n");
    if (text.length > 300) return text;
  }

  //  Generic article tag
  const article = document.querySelector("article");
  if (article) {
    const ps = Array.from(article.querySelectorAll("p"))
      .filter(p => isVisible(p))
      .map(p => p.innerText.trim())
      .filter(p => p.length > 40);

    const text = ps.join("\n");
    if (text.length > 300) return text;
  }

  //  Generic fallback for blogs/news
  const ps = Array.from(document.querySelectorAll("p"))
    .filter(p => isVisible(p))
    .map(p => p.innerText.trim())
    .filter(p => p.length > 40);

  const text = ps.join("\n");
  return text.length > 300 ? text : "";
}

//  Message listener (popup → content)
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === "GET_ARTICLE_TEXT") {
    const text = getArticleText();
    sendResponse({ text });
  }
});
