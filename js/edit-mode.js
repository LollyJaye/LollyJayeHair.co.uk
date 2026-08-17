/* ==========================================================================
   Edit Mode — click any text on the page to change its font/colour.
   --------------------------------------------------------------------------
   IMPORTANT: this saves to THIS BROWSER ONLY (localStorage). It does not
   change the live site for other visitors. Use "Export my changes" to get a
   copy-pasteable list to send to your developer so it can be made permanent
   in the actual site files. See README.md "Edit Mode" for details.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', initEditMode);

const EDIT_STORAGE_KEY = 'lj_edit_overrides';

const FONT_OPTIONS = [
  { label: 'Playfair Display', value: "'Playfair Display', Georgia, serif" },
  { label: 'Cormorant Garamond', value: "'Cormorant Garamond', Georgia, serif" },
  { label: 'Beau Rivage (script)', value: "'Beau Rivage', cursive" },
  { label: 'Noto Serif Display', value: "'Noto Serif Display', serif" },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Georgia', value: "Georgia, serif" },
  { label: 'Inter (sans-serif)', value: "'Inter', Arial, sans-serif" },
  { label: 'Arial (sans-serif)', value: "Arial, Helvetica, sans-serif" }
];

const SWATCHES = ['#73584b', '#c2b19c', '#bfa07a', '#6b5241', '#ffffff', '#fff9f4'];

const EDITABLE_SELECTOR = 'h1, h2, h3, h4, p, a, span, li, label, button, div.date-heading, div.date-loc';
const SKIP_ANCESTORS = '.ask-panel, .ask-toggle, .edit-panel, .edit-toolbar, .nav-toggle';

function initEditMode() {
  const toggle = document.createElement('button');
  toggle.className = 'edit-mode-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Toggle edit mode');
  toggle.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
    <span>Edit</span>
  `;
  document.body.appendChild(toggle);

  const toolbar = document.createElement('div');
  toolbar.className = 'edit-toolbar';
  toolbar.innerHTML = `
    <div class="edit-toolbar-row">
      <label>Font
        <select class="edit-font"></select>
      </label>
    </div>
    <div class="edit-toolbar-row">
      <label>Colour
        <input type="color" class="edit-color" value="#73584b">
      </label>
      <div class="edit-swatches"></div>
    </div>
    <div class="edit-toolbar-row edit-toolbar-actions">
      <button type="button" class="edit-apply">Apply</button>
      <button type="button" class="edit-reset">Reset this</button>
    </div>
  `;
  document.body.appendChild(toolbar);

  const fontSelect = toolbar.querySelector('.edit-font');
  FONT_OPTIONS.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.value;
    opt.textContent = f.label;
    fontSelect.appendChild(opt);
  });

  const swatchWrap = toolbar.querySelector('.edit-swatches');
  const colorInput = toolbar.querySelector('.edit-color');
  SWATCHES.forEach(hex => {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'edit-swatch';
    sw.style.background = hex;
    sw.addEventListener('click', () => { colorInput.value = hex; });
    swatchWrap.appendChild(sw);
  });

  const panel = document.createElement('div');
  panel.className = 'edit-panel';
  panel.innerHTML = `
    <div class="edit-panel-header">
      <span>Your local edits</span>
      <button type="button" class="edit-panel-close" aria-label="Close">&times;</button>
    </div>
    <p class="edit-panel-note">Saved to this browser only — not visible to other visitors yet.</p>
    <textarea class="edit-panel-list" readonly rows="6"></textarea>
    <div class="edit-panel-actions">
      <button type="button" class="edit-copy">Copy list</button>
      <button type="button" class="edit-clear-all">Clear all</button>
    </div>
  `;
  document.body.appendChild(panel);

  let active = false;
  let selectedEl = null;
  let hoverEl = null;

  function overrides() {
    try { return JSON.parse(localStorage.getItem(EDIT_STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveOverrides(data) {
    localStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(data));
  }

  function pathFor(el) {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      let selector = node.tagName.toLowerCase();
      if (node.id) {
        selector += '#' + node.id;
        parts.unshift(selector);
        break;
      }
      const siblings = Array.from(node.parentNode ? node.parentNode.children : []).filter(s => s.tagName === node.tagName);
      if (siblings.length > 1) selector += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      parts.unshift(selector);
      node = node.parentNode;
    }
    return parts.join(' > ');
  }

  function keyFor(el) {
    return location.pathname.replace(/^\//, '') + '::' + pathFor(el);
  }

  function applyStoredOverrides() {
    const data = overrides();
    Object.keys(data).forEach(key => {
      const [page, selector] = key.split('::');
      if (page !== location.pathname.replace(/^\//, '')) return;
      try {
        const el = document.querySelector(selector);
        if (el) {
          if (data[key].fontFamily) el.style.fontFamily = data[key].fontFamily;
          if (data[key].color) el.style.color = data[key].color;
        }
      } catch (e) { /* stale selector, ignore */ }
    });
  }

  function refreshPanelList() {
    const data = overrides();
    const lines = Object.keys(data).map(key => {
      const v = data[key];
      const bits = [];
      if (v.fontFamily) bits.push(`font: ${v.fontFamily}`);
      if (v.color) bits.push(`color: ${v.color}`);
      return `${key}\n  ${bits.join(', ')}`;
    });
    panel.querySelector('.edit-panel-list').value = lines.length
      ? lines.join('\n\n')
      : 'No local edits yet — click "Edit" then click some text.';
  }

  toggle.addEventListener('click', () => {
    active = !active;
    document.body.classList.toggle('edit-mode-on', active);
    toggle.classList.toggle('active', active);
    toolbar.classList.remove('open');
    if (!active) {
      if (hoverEl) hoverEl.classList.remove('edit-hover');
      selectedEl = null;
    }
  });

  document.addEventListener('mouseover', (e) => {
    if (!active) return;
    if (e.target.closest(SKIP_ANCESTORS)) return;
    if (!e.target.matches(EDITABLE_SELECTOR)) return;
    if (hoverEl && hoverEl !== e.target) hoverEl.classList.remove('edit-hover');
    hoverEl = e.target;
    hoverEl.classList.add('edit-hover');
  });

  document.addEventListener('click', (e) => {
    if (!active) return;
    if (e.target.closest(SKIP_ANCESTORS)) return;
    if (!e.target.matches(EDITABLE_SELECTOR)) return;
    e.preventDefault();
    e.stopPropagation();

    selectedEl = e.target;
    document.querySelectorAll('.edit-selected').forEach(el => el.classList.remove('edit-selected'));
    selectedEl.classList.add('edit-selected');

    const cs = getComputedStyle(selectedEl);
    const currentFont = FONT_OPTIONS.find(f => cs.fontFamily.includes(f.value.split(',')[0].replace(/'/g, '')));
    fontSelect.value = currentFont ? currentFont.value : FONT_OPTIONS[0].value;
    const hex = rgbToHex(cs.color);
    if (hex) colorInput.value = hex;

    const rect = selectedEl.getBoundingClientRect();
    toolbar.style.top = `${window.scrollY + rect.top - toolbar.offsetHeight - 10}px`;
    toolbar.style.left = `${Math.max(12, window.scrollX + rect.left)}px`;
    toolbar.classList.add('open');
  }, true);

  toolbar.querySelector('.edit-apply').addEventListener('click', () => {
    if (!selectedEl) return;
    selectedEl.style.fontFamily = fontSelect.value;
    selectedEl.style.color = colorInput.value;

    const data = overrides();
    data[keyFor(selectedEl)] = { fontFamily: fontSelect.value, color: colorInput.value };
    saveOverrides(data);
    refreshPanelList();
  });

  toolbar.querySelector('.edit-reset').addEventListener('click', () => {
    if (!selectedEl) return;
    selectedEl.style.fontFamily = '';
    selectedEl.style.color = '';
    const data = overrides();
    delete data[keyFor(selectedEl)];
    saveOverrides(data);
    refreshPanelList();
    toolbar.classList.remove('open');
  });

  toggle.addEventListener('dblclick', () => {
    panel.classList.add('open');
    refreshPanelList();
  });

  panel.querySelector('.edit-panel-close').addEventListener('click', () => panel.classList.remove('open'));

  panel.querySelector('.edit-copy').addEventListener('click', () => {
    const list = panel.querySelector('.edit-panel-list');
    list.select();
    document.execCommand('copy');
  });

  panel.querySelector('.edit-clear-all').addEventListener('click', () => {
    if (!confirm('Clear all local edits on this device? This cannot be undone.')) return;
    localStorage.removeItem(EDIT_STORAGE_KEY);
    document.querySelectorAll('[style]').forEach(el => {
      if (el.closest(SKIP_ANCESTORS)) return;
    });
    location.reload();
  });

  function rgbToHex(rgb) {
    const m = rgb.match(/\d+/g);
    if (!m) return null;
    return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  }

  applyStoredOverrides();
}
