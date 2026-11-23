/* flowDev · guía paso a paso de los talleres.
   window.flowTour.start(pasos, clave)  → muestra la guía
   window.flowTour.auto(pasos, clave)   → la muestra solo la primera vez (se recuerda en localStorage)
   Cada paso: { sel: 'selector CSS' (opcional), title, text, before: () => {} (opcional) } */
(() => {
  'use strict';
  const CSS = `
.ft-shade{position:fixed;inset:0;z-index:9998;background:transparent}
.ft-hole{position:fixed;z-index:9999;border-radius:14px;box-shadow:0 0 0 3px #DCEEFB,0 0 0 100vmax rgba(10,10,9,.62);pointer-events:none;transition:all .25s ease}
.ft-hole.none{box-shadow:0 0 0 100vmax rgba(10,10,9,.62);width:0!important;height:0!important;left:50%!important;top:50%!important}
.ft-card{position:fixed;z-index:10000;width:min(360px,calc(100vw - 32px));background:#111110;color:#fff;border-radius:20px;padding:18px 18px 14px;font-family:'Inter Tight','Helvetica Neue',Arial,sans-serif;font-size:14.5px;line-height:1.45;box-shadow:0 18px 50px rgba(0,0,0,.45);transition:top .25s ease,left .25s ease}
.ft-card:focus{outline:none}
.ft-step{font-family:'JetBrains Mono',Consolas,monospace;font-size:12px;color:#A5A59D;margin:0 0 6px}
.ft-card h2{font-size:20px;font-weight:500;letter-spacing:-.02em;line-height:1.15;margin:0 0 6px}
.ft-card p{margin:0;color:#D6D6CE}
.ft-card code{font-family:'JetBrains Mono',Consolas,monospace;font-size:.86em;background:#3D3D39;border-radius:6px;padding:1px 5px}
.ft-bar{display:flex;align-items:center;gap:8px;margin-top:16px}
.ft-dots{display:flex;gap:5px;margin-right:auto}
.ft-dots i{width:7px;height:7px;border-radius:50%;background:#3D3D39}
.ft-dots i.on{background:#DCEEFB}
.ft-card button{font:inherit;font-size:13.5px;font-weight:500;border-radius:99px;padding:7px 14px;cursor:pointer;border:1.5px solid #DCEEFB;background:#DCEEFB;color:#111110}
.ft-card button.ft-ghost{background:transparent;color:#fff;border-color:#55554f}
.ft-card button.ft-skip{border:0;background:none;color:#A5A59D;padding:7px 4px}
.ft-card button:focus-visible{outline:2px solid #7FA4C0;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.ft-hole,.ft-card{transition:none}}`;
  let ui = null, steps = [], i = 0, key = '', lastFocus = null;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Texto de los pasos: escapado, con `código` entre comillas invertidas
  const fmt = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  const seen = k => { try { return localStorage.getItem('flowdev-tour-' + k) === '1'; } catch (_) { return false; } };
  const remember = k => { try { localStorage.setItem('flowdev-tour-' + k, '1'); } catch (_) {} };

  function build() {
    if (!document.getElementById('ft-style')) {
      const st = document.createElement('style'); st.id = 'ft-style'; st.textContent = CSS; document.head.appendChild(st);
    }
    const shade = document.createElement('div'); shade.className = 'ft-shade';
    const hole = document.createElement('div'); hole.className = 'ft-hole';
    const card = document.createElement('div'); card.className = 'ft-card';
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-labelledby', 'ft-title'); card.tabIndex = -1;
    document.body.append(shade, hole, card);
    card.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.ft === 'next') go(i + 1); else if (b.dataset.ft === 'prev') go(i - 1); else close();
    });
    shade.addEventListener('click', e => e.stopPropagation());
    return { shade, hole, card };
  }
  const target = s => {
    const el = s.sel && document.querySelector(s.sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width && r.height ? { el, r } : null;
  };
  function place() {
    if (!ui) return;
    const { hole, card } = ui, t = target(steps[i]), pad = 6, gap = 14, vw = innerWidth, vh = innerHeight;
    const cw = card.offsetWidth, ch = card.offsetHeight;
    if (!t) {
      hole.classList.add('none');
      card.style.left = Math.max(16, (vw - cw) / 2) + 'px'; card.style.top = Math.max(16, (vh - ch) / 2) + 'px';
      return;
    }
    const r = t.r;
    hole.classList.remove('none');
    Object.assign(hole.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
    // Lugar para la tarjeta: abajo, arriba, a la derecha o a la izquierda del elemento; si no entra, centrada abajo
    const opts = [
      [r.left, r.bottom + pad + gap, r.bottom + pad + gap + ch <= vh - 16],
      [r.left, r.top - pad - gap - ch, r.top - pad - gap - ch >= 16],
      [r.right + pad + gap, r.top, r.right + pad + gap + cw <= vw - 16],
      [r.left - pad - gap - cw, r.top, r.left - pad - gap - cw >= 16],
    ];
    const o = opts.find(x => x[2]) || [(vw - cw) / 2, vh - ch - 16];
    card.style.left = Math.min(Math.max(16, o[0]), vw - cw - 16) + 'px';
    card.style.top = Math.min(Math.max(16, o[1]), vh - ch - 16) + 'px';
  }
  function go(n) {
    if (n < 0) return;
    if (n >= steps.length) return close();
    i = n;
    const s = steps[i], last = i === steps.length - 1;
    try { s.before?.(); } catch (_) {}
    const t = target(s); if (t) t.el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    ui.card.innerHTML = `<p class="ft-step">${i + 1} / ${steps.length}</p><h2 id="ft-title">${esc(s.title)}</h2><p>${fmt(s.text)}</p>
      <div class="ft-bar"><span class="ft-dots" aria-hidden="true">${steps.map((_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('')}</span>
      ${last ? '' : '<button type="button" class="ft-skip" data-ft="close">Saltar</button>'}
      ${i ? '<button type="button" class="ft-ghost" data-ft="prev">Anterior</button>' : ''}
      <button type="button" data-ft="next">${last ? 'Empezar' : 'Siguiente'}</button></div>`;
    requestAnimationFrame(place);
    ui.card.querySelector('[data-ft="next"]').focus();
  }
  function onKey(e) {
    if (!ui) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
    else if (e.key === 'Tab') { // el foco queda dentro de la tarjeta
      const bs = [...ui.card.querySelectorAll('button')]; if (!bs.length) return;
      const k = bs.indexOf(document.activeElement);
      if (e.shiftKey && k <= 0) { e.preventDefault(); bs[bs.length - 1].focus(); }
      else if (!e.shiftKey && k === bs.length - 1) { e.preventDefault(); bs[0].focus(); }
    }
  }
  function close() {
    if (!ui) return;
    try { steps[steps.length - 1].after?.(); } catch (_) {}
    ui.shade.remove(); ui.hole.remove(); ui.card.remove(); ui = null;
    remember(key);
    removeEventListener('resize', place); removeEventListener('scroll', place, true); document.removeEventListener('keydown', onKey, true);
    lastFocus?.focus?.();
  }
  function start(list, k) {
    if (ui) close();
    steps = list; key = k; lastFocus = document.activeElement; ui = build();
    addEventListener('resize', place); addEventListener('scroll', place, true); document.addEventListener('keydown', onKey, true);
    go(0);
  }
  window.flowTour = { start, auto: (list, k) => { if (!seen(k)) start(list, k); }, isOpen: () => !!ui };
})();
