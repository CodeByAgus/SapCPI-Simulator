/* Marcas de cada simulador de flowDev (diseños propios, no son los logos de las marcas).
   Cualquier elemento con data-mark="api|sap|pa|cc" recibe su marca, también si se agrega después. */
(() => {
  const g = (bg, fg, body, border = '') => `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect x="1" y="1" width="46" height="46" rx="13" fill="${bg}"${border ? ` stroke="${border}" stroke-width="2"` : ''}/><g fill="none" stroke="${fg}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  const MARKS = {
    // Conexiones: dos sistemas que intercambian pedidos y respuestas
    api: ['Conexiones y APIs', g('#DCEEFB', '#111110', '<circle cx="12.5" cy="24" r="4.5"/><circle cx="35.5" cy="24" r="4.5"/><path d="M18 19.5h12M27 16.5l3 3-3 3M30 28.5H18M21 31.5l-3-3 3-3"/>', '#111110')],
    // SAP CPI: un iFlow en notación BPMN (inicio, paso y fin)
    sap: ['SAP CPI', g('#3D3D39', '#DCEEFB', '<circle cx="10.5" cy="24" r="4"/><rect x="18" y="18" width="12" height="12" rx="3"/><circle cx="37.5" cy="24" r="4" stroke-width="3.6"/><path d="M14.5 24H18M30 24h3.5"/>')],
    // Power Automate: un cloud flow, trigger y acciones en columna
    pa: ['Power Automate', g('#111110', '#DCEEFB', '<rect x="13" y="8" width="22" height="8" rx="3"/><rect x="13" y="20" width="22" height="8" rx="3"/><rect x="13" y="32" width="22" height="8" rx="3"/><path d="M24 16v4M24 28v4"/>')],
    // Claude Code: la terminal y las etapas del agente
    cc: ['Claude Code', g('#FFFFFF', '#111110', '<path d="M12 16l7 6-7 6M23 30h13"/><path d="M28 14h8M31 19h5" stroke-width="2"/>', '#111110')],
  };
  const css = document.createElement('style');
  css.textContent = '.mark{display:inline-flex;flex:none;width:var(--mark,44px);height:var(--mark,44px);vertical-align:middle}.mark svg{width:100%;height:100%;display:block}.mark-row{display:flex;align-items:center;gap:12px}.mark.sm{--mark:30px}.mark.lg{--mark:64px}.lc-card .mark,.dash-card .mark{--mark:52px}';
  document.head.appendChild(css);
  const fill = root => root.querySelectorAll('[data-mark]').forEach(el => { const m = MARKS[el.dataset.mark]; if (m && el.dataset.markDone !== el.dataset.mark) { el.innerHTML = m[1]; el.dataset.markDone = el.dataset.mark; if (!el.hasAttribute('aria-hidden')) el.setAttribute('aria-hidden', 'true'); } });
  window.flowMark = (k, cls = '') => `<span class="mark ${cls}" data-mark="${k}">${MARKS[k] ? MARKS[k][1] : ''}</span>`;
  const start = () => { fill(document); new MutationObserver(() => fill(document)).observe(document.body, { childList: true, subtree: true }); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
