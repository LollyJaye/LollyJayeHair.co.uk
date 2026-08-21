/* ==========================================================================
   Edit Mode – click any text on the page to change its font/colour/style,
   or drag it to nudge its position.
   --------------------------------------------------------------------------
   IMPORTANT: this saves to THIS BROWSER ONLY (localStorage). It does not
   change the live site for other visitors. Use "Export my changes" to get a
   copy-pasteable list to send to your developer so it can be made permanent
   in the actual site files. See README.md "Edit Mode" for details.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', initEditMode);

const EDIT_STORAGE_KEY = 'lj_edit_overrides';

/* Fonts grouped by family, each with its available weights ("subfonts").
   Families marked (not loaded) are referenced by name only – no Google Fonts
   file exists for them, so they only render correctly for visitors who
   happen to have that font installed locally; everyone else sees the
   fallback listed after it. */
const FONT_GROUPS = [
  { family: 'Playfair Display', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Medium', weight: '500' },
    { label: 'SemiBold', weight: '600' },
    { label: 'Bold', weight: '700' }
  ], stack: "'Playfair Display', Georgia, serif" },

  { family: 'Cormorant Garamond', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Medium', weight: '500' },
    { label: 'SemiBold', weight: '600' }
  ], stack: "'Cormorant Garamond', Georgia, serif" },

  { family: 'Noto Serif Display', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Bold', weight: '700' }
  ], stack: "'Noto Serif Display', serif" },

  { family: 'Inter', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Medium', weight: '500' },
    { label: 'SemiBold', weight: '600' }
  ], stack: "'Inter', Arial, sans-serif" },

  { family: 'Montserrat', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Medium', weight: '500' },
    { label: 'SemiBold', weight: '600' },
    { label: 'Bold', weight: '700' }
  ], stack: "'Montserrat', Arial, sans-serif" },

  { family: 'Poppins', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Medium', weight: '500' },
    { label: 'SemiBold', weight: '600' },
    { label: 'Bold', weight: '700' }
  ], stack: "'Poppins', Arial, sans-serif" },

  { family: 'Lato', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Bold', weight: '700' }
  ], stack: "'Lato', Arial, sans-serif" },

  { family: 'Merriweather', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Bold', weight: '700' }
  ], stack: "'Merriweather', Georgia, serif" },

  { family: 'Lora', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Medium', weight: '500' },
    { label: 'SemiBold', weight: '600' }
  ], stack: "'Lora', Georgia, serif" },

  { family: 'Beau Rivage (script)', variants: [
    { label: 'Regular', weight: '400' }
  ], stack: "'Beau Rivage', cursive" },

  { family: 'Times New Roman', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Bold', weight: '700' }
  ], stack: "'Times New Roman', Times, serif" },

  { family: 'Times New Roman MT Condensed (not loaded)', variants: [
    { label: 'Regular', weight: '400' }
  ], stack: "'Times New Roman MT Condensed', 'Times New Roman', Times, serif" },

  { family: 'TT Norms (not loaded)', variants: [
    { label: 'Regular', weight: '400' }
  ], stack: "'TT Norms', 'Inter', Arial, sans-serif" },

  { family: 'TT Hoves (not loaded)', variants: [
    { label: 'Regular', weight: '400' }
  ], stack: "'TT Hoves', 'Inter', Arial, sans-serif" },

  { family: 'Georgia', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Bold', weight: '700' }
  ], stack: "Georgia, serif" },

  { family: 'Arial', variants: [
    { label: 'Regular', weight: '400' },
    { label: 'Bold', weight: '700' }
  ], stack: "Arial, Helvetica, sans-serif" }
];

/* Flattened list so each variant can be addressed by a simple index. */
const FONT_OPTIONS = FONT_GROUPS.flatMap(g => g.variants.map(v => ({
  group: g.family,
  label: v.label,
  weight: v.weight,
  value: g.stack
})));

const SWATCHES = ['#73584b', '#c2b19c', '#bfa07a', '#6b5241', '#ffffff', '#fff9f4'];

const EDITABLE_SELECTOR = 'h1, h2, h3, h4, p, a, span, li, label, button, div.date-heading, div.date-loc';
const SKIP_ANCESTORS = '.ask-panel, .ask-toggle, .edit-panel, .edit-toolbar, .nav-toggle';
const DRAG_THRESHOLD = 4;

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
    <div class="edit-toolbar-row edit-toolbar-style">
      <button type="button" class="edit-italic-btn" title="Toggle italic"><em>Italic</em></button>
      <button type="button" class="edit-recenter-btn" title="Undo any dragging – puts it back where it started">Recenter</button>
    </div>
    <p class="edit-drag-hint">Tip: drag the selected text to nudge its position.</p>
    <div class="edit-toolbar-row edit-toolbar-actions">
      <button type="button" class="edit-apply">Apply</button>
      <button type="button" class="edit-reset">Reset this</button>
    </div>
  `;
  document.body.appendChild(toolbar);

  const fontSelect = toolbar.querySelector('.edit-font');
  FONT_GROUPS.forEach(g => {
    const group = document.createElement('optgroup');
    group.label = g.family;
    g.variants.forEach(v => {
      const idx = FONT_OPTIONS.findIndex(f => f.group === g.family && f.weight === v.weight);
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = v.label;
      group.appendChild(opt);
    });
    fontSelect.appendChild(group);
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

  const italicBtn = toolbar.querySelector('.edit-italic-btn');
  const recenterBtn = toolbar.querySelector('.edit-recenter-btn');
  let italicOn = false;

  const panel = document.createElement('div');
  panel.className = 'edit-panel';
  panel.innerHTML = `
    <div class="edit-panel-header">
      <span>Your local edits</span>
      <button type="button" class="edit-panel-close" aria-label="Close">&times;</button>
    </div>
    <p class="edit-panel-note">Saved to this browser only – not visible to other visitors yet.</p>
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

  function applyEntry(el, entry) {
    if (!entry) return;
    if (entry.fontFamily) el.style.fontFamily = entry.fontFamily;
    if (entry.fontWeight) el.style.fontWeight = entry.fontWeight;
    if (entry.color) el.style.color = entry.color;
    if (entry.fontStyle) el.style.fontStyle = entry.fontStyle;
    if (entry.left || entry.top) {
      el.style.position = 'relative';
      el.style.left = `${entry.left || 0}px`;
      el.style.top = `${entry.top || 0}px`;
    }
  }

  function applyStoredOverrides() {
    const data = overrides();
    Object.keys(data).forEach(key => {
      const [page, selector] = key.split('::');
      if (page !== location.pathname.replace(/^\//, '')) return;
      try {
        const el = document.querySelector(selector);
        if (el) applyEntry(el, data[key]);
      } catch (e) { /* stale selector, ignore */ }
    });
  }

  function refreshPanelList() {
    const data = overrides();
    const lines = Object.keys(data).map(key => {
      const v = data[key];
      const bits = [];
      if (v.fontFamily) bits.push(`font: ${v.fontFamily}${v.fontWeight ? ' (weight ' + v.fontWeight + ')' : ''}`);
      if (v.color) bits.push(`color: ${v.color}`);
      if (v.fontStyle) bits.push(`style: ${v.fontStyle}`);
      if (v.left || v.top) bits.push(`moved: ${v.left || 0}px right, ${v.top || 0}px down`);
      return `${key}\n  ${bits.join(', ')}`;
    });
    panel.querySelector('.edit-panel-list').value = lines.length
      ? lines.join('\n\n')
      : 'No local edits yet – click "Edit" then click some text.';
  }

  function positionToolbar() {
    if (!selectedEl) return;
    const rect = selectedEl.getBoundingClientRect();
    toolbar.style.top = `${window.scrollY + rect.top - toolbar.offsetHeight - 10}px`;
    toolbar.style.left = `${Math.max(12, window.scrollX + rect.left)}px`;
  }

  function selectElement(el) {
    selectedEl = el;
    document.querySelectorAll('.edit-selected').forEach(x => x.classList.remove('edit-selected'));
    selectedEl.classList.add('edit-selected');

    const cs = getComputedStyle(selectedEl);
    const csWeight = String(normalizeWeight(cs.fontWeight));
    const familyMatches = FONT_OPTIONS
      .map((f, idx) => ({ f, idx }))
      .filter(({ f }) => cs.fontFamily.includes(f.value.split(',')[0].replace(/'/g, '')));
    const exact = familyMatches.find(({ f }) => String(normalizeWeight(f.weight)) === csWeight);
    const chosen = exact || familyMatches[0];
    fontSelect.value = chosen ? String(chosen.idx) : '0';
    const hex = rgbToHex(cs.color);
    if (hex) colorInput.value = hex;

    italicOn = cs.fontStyle === 'italic';
    italicBtn.classList.toggle('active', italicOn);

    positionToolbar();
    toolbar.classList.add('open');
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

  /* ---- click to select, drag to nudge position (unified via Pointer Events) ---- */
  let dragTarget = null;
  let dragStartX = 0, dragStartY = 0;
  let dragOrigLeft = 0, dragOrigTop = 0;
  let dragMoved = false;
  let justDragged = false;

  document.addEventListener('pointerdown', (e) => {
    if (!active) return;
    if (e.target.closest(SKIP_ANCESTORS)) return;
    if (!e.target.matches(EDITABLE_SELECTOR)) return;

    dragTarget = e.target;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const data = overrides();
    const entry = data[keyFor(dragTarget)] || {};
    dragOrigLeft = entry.left || 0;
    dragOrigTop = entry.top || 0;
    dragMoved = false;
  });

  document.addEventListener('pointermove', (e) => {
    if (!active || !dragTarget) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (!dragMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    dragMoved = true;
    dragTarget.classList.add('edit-dragging');
    dragTarget.style.position = 'relative';
    dragTarget.style.left = `${dragOrigLeft + dx}px`;
    dragTarget.style.top = `${dragOrigTop + dy}px`;
  });

  document.addEventListener('pointerup', (e) => {
    if (!active || !dragTarget) return;
    if (dragMoved) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      const data = overrides();
      const key = keyFor(dragTarget);
      data[key] = Object.assign({}, data[key], { left: dragOrigLeft + dx, top: dragOrigTop + dy });
      saveOverrides(data);
      refreshPanelList();
      dragTarget.classList.remove('edit-dragging');
      justDragged = true;
      selectElement(dragTarget);
    }
    dragTarget = null;
    dragMoved = false;
  });

  document.addEventListener('click', (e) => {
    if (!active) return;
    if (justDragged) { justDragged = false; return; }
    if (e.target.closest(SKIP_ANCESTORS)) return;
    if (!e.target.matches(EDITABLE_SELECTOR)) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(e.target);
  }, true);

  toolbar.querySelector('.edit-apply').addEventListener('click', () => {
    if (!selectedEl) return;
    const chosen = FONT_OPTIONS[parseInt(fontSelect.value, 10)] || FONT_OPTIONS[0];
    selectedEl.style.fontFamily = chosen.value;
    selectedEl.style.fontWeight = chosen.weight;
    selectedEl.style.color = colorInput.value;
    selectedEl.style.fontStyle = italicOn ? 'italic' : 'normal';

    const data = overrides();
    const key = keyFor(selectedEl);
    data[key] = Object.assign({}, data[key], {
      fontFamily: chosen.value,
      fontWeight: chosen.weight,
      color: colorInput.value,
      fontStyle: italicOn ? 'italic' : 'normal'
    });
    saveOverrides(data);
    refreshPanelList();
  });

  toolbar.querySelector('.edit-reset').addEventListener('click', () => {
    if (!selectedEl) return;
    selectedEl.style.fontFamily = '';
    selectedEl.style.fontWeight = '';
    selectedEl.style.color = '';
    selectedEl.style.fontStyle = '';
    selectedEl.style.left = '';
    selectedEl.style.top = '';
    const data = overrides();
    delete data[keyFor(selectedEl)];
    saveOverrides(data);
    refreshPanelList();
    toolbar.classList.remove('open');
  });

  italicBtn.addEventListener('click', () => {
    italicOn = !italicOn;
    italicBtn.classList.toggle('active', italicOn);
    if (selectedEl) selectedEl.style.fontStyle = italicOn ? 'italic' : 'normal';
  });

  recenterBtn.addEventListener('click', () => {
    if (!selectedEl) return;
    selectedEl.style.left = '';
    selectedEl.style.top = '';
    const data = overrides();
    const key = keyFor(selectedEl);
    if (data[key]) {
      delete data[key].left;
      delete data[key].top;
      saveOverrides(data);
      refreshPanelList();
    }
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
    location.reload();
  });

  function normalizeWeight(w) {
    if (w === 'normal') return 400;
    if (w === 'bold') return 700;
    return parseInt(w, 10) || 400;
  }

  function rgbToHex(rgb) {
    const m = rgb.match(/\d+/g);
    if (!m) return null;
    return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  }

  applyStoredOverrides();
}
