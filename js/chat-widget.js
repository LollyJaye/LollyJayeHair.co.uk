/* ==========================================================================
   "Ask" widget – searches the site content for an answer.
   --------------------------------------------------------------------------
   Honest label for what this is: it's keyword search over js/search-data.js,
   not a generative AI / LLM. That means zero cost, zero backend, and it
   works offline – but it can only surface content that's already on the
   site, not hold a real conversation. See README.md "The Ask widget" for
   how to upgrade this to a real AI chatbot later if wanted.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', initAskWidget);

const STOPWORDS = new Set([
  'the','a','an','is','are','do','does','did','how','what','when','where','why',
  'to','for','of','on','in','at','and','or','with','about','can','i','you','your',
  'my','me','it','this','that','be','have','has','need','want','please','tell',
  'much','many','get','book','out','so','if'
]);

function tokenize(str) {
  return (str.toLowerCase().match(/[a-z0-9:]+/g) || []).filter(w => w.length > 1 && !STOPWORDS.has(w));
}

function bestMatches(query, index, limit = 2) {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  const scored = index.map(entry => {
    const titleTokens = tokenize(entry.title);
    const bodyTokens = tokenize(entry.text);
    let score = 0;
    qTokens.forEach(qt => {
      if (titleTokens.some(t => t.includes(qt) || qt.includes(t))) score += 3;
      if (bodyTokens.some(t => t.includes(qt) || qt.includes(t))) score += 1;
    });
    return { entry, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry);
}

function snippetFor(entry, query) {
  const sentences = entry.text.split(/(?<=[.!?])\s+/);
  const qTokens = tokenize(query);
  let best = sentences[0];
  let bestScore = -1;
  sentences.forEach(s => {
    const sTokens = tokenize(s);
    const score = qTokens.filter(qt => sTokens.some(t => t.includes(qt))).length;
    if (score > bestScore) { bestScore = score; best = s; }
  });
  return best;
}

function initAskWidget() {
  const index = window.SITE_SEARCH_INDEX || [];

  const toggle = document.createElement('button');
  toggle.className = 'ask-toggle';
  toggle.setAttribute('aria-label', 'Ask a question about this site');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = `
    <svg class="icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
    <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
  `;

  const panel = document.createElement('div');
  panel.className = 'ask-panel';
  panel.innerHTML = `
    <div class="ask-header">
      <span class="ask-header-title">Ask about Lolly Jaye Hair</span>
      <span class="ask-header-sub">Searches this website to answer – not a live chat with Lolly</span>
    </div>
    <div class="ask-messages" id="ask-messages"></div>
    <form class="ask-form" id="ask-form" autocomplete="off">
      <input type="text" id="ask-input" placeholder="Try “how do I book a shadow day”" required>
      <button type="submit">Ask</button>
    </form>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector('#ask-messages');
  const formEl = panel.querySelector('#ask-form');
  const inputEl = panel.querySelector('#ask-input');

  function addMessage(html, who) {
    const msg = document.createElement('div');
    msg.className = `ask-msg ${who}`;
    msg.innerHTML = html;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function greet() {
    if (messagesEl.children.length > 0) return;
    addMessage("Hi! Ask me about booking, Shadow Days, classes, or anything else on the site and I'll point you to the right page.", 'bot');
  }

  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      greet();
      inputEl.focus();
    }
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = inputEl.value.trim();
    if (!query) return;

    addMessage(escapeHtml(query), 'user');
    inputEl.value = '';

    const matches = bestMatches(query, index, 2);

    if (matches.length === 0) {
      addMessage(
        `I couldn't find anything on the site about that. Try asking about bookings, Shadow Days, Look &amp; Learn classes, 1:1 education, private classes, or <a href="contact.html">contact Lolly directly</a>.`,
        'bot'
      );
      return;
    }

    const html = matches.map(entry => {
      const snippet = snippetFor(entry, query);
      return `${escapeHtml(snippet)}<br><a href="${entry.url}">View ${escapeHtml(entry.title)} →</a>`;
    }).join('<hr style="border:none;border-top:1px solid var(--border-soft);margin:10px 0;">');

    addMessage(html, 'bot');
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
