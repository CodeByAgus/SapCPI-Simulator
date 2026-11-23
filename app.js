(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const short = (s, n = 80) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n) + '…' : s; };

/* ---------------- Plantillas de index.html ---------------- */
// Clona un <template> y lo completa: data-if="clave" (o "!clave") deja o quita el elemento,
// data-text="clave" pone el texto y data-href="clave" el enlace.
function tpl(id, vals = {}) {
  const f = document.getElementById(id).content.cloneNode(true);
  f.querySelectorAll('[data-if]').forEach(el => {
    const k = el.dataset.if, neg = k[0] === '!';
    if (!!vals[neg ? k.slice(1) : k] === neg) el.remove(); else el.removeAttribute('data-if');
  });
  f.querySelectorAll('[data-text]').forEach(el => { el.textContent = vals[el.dataset.text] ?? ''; });
  f.querySelectorAll('[data-href]').forEach(el => { el.href = vals[el.dataset.href] ?? '#'; });
  return f;
}
const meter = (el, d, t) => { el.querySelector('span').style.width = `${t ? Math.round(d / t * 100) : 0}%`; };

/* ---------------- Catálogo de las plataformas ---------------- */
// El contenido vive en sap-cpi/ y power-automate/. La landing solo necesita los ids y títulos para Mi avance:
// si se agregan clases, escenarios o cuestionarios en una plataforma, hay que actualizar este catálogo.
const PA = {
  href: 'power-automate/index.html', lessons: 20, quizzes: 20,
  esc: [
    ['bienvenida', 'Ejercicio_001: Bienvenida a un curso desde Forms'],
    ['normalizar', 'Ejercicio_002: Normalizar datos con expresiones'],
    ['pendientes', 'Ejercicio_003: Pedidos pendientes con Filter array y Select'],
    ['tickets-switch', 'Ejercicio_004: Derivar pedidos de soporte con Switch'],
    ['validar', 'Ejercicio_005: Validar datos y terminar con un error claro'],
    ['cobranzas', 'Ejercicio_006: Recordatorios de cobranza desde Excel'],
    ['compras-sp', 'Ejercicio_007: Solicitudes de compra desde SharePoint'],
    ['gastos', 'Ejercicio_008: Aprobación de gastos'],
    ['lead-dataverse', 'Ejercicio_009: Lead de un formulario a Dataverse y Teams'],
    ['dolar', 'Ejercicio_010: Alerta de cotización del dólar'],
    ['facturas-ia', 'Ejercicio_011: Leer facturas de proveedores con AI Builder'],
    ['rpa-erp', 'Cargar pedidos en un ERP sin API con RPA'],
    ['powerapps', 'Alta de empleados desde una app de Power Apps'],
    ['kpi-ventas', 'KPIs de ventas a Power BI con variables'],
    ['monitoreo', 'Monitorear servicios con HTTP y variables'],
    ['resumen-ia', 'Resumen semanal de reclamos con IA'],
    ['aprobacion-2-niveles', 'Aprobación en dos niveles'],
    ['onboarding', 'Onboarding de un empleado nuevo'],
    ['encuesta-ia', 'Clasificar encuestas de satisfacción con IA'],
    ['backup-csv', 'Respaldo semanal de clientes en CSV'],
  ],
};
const SAP = {
  href: 'sap-cpi/index.html', taller: 'sap-cpi/taller.html', lessons: 20, quizzes: 20, scenarios: 11, practice: 9,
  // Escenarios guiados y práctica extra del taller de iFlows
  esc: [
    ['b-001', 'Ejercicio_001: creación de iFlow y controles básicos'],
    ['b-001b', 'Ejercicio_001, segundo escenario: encriptado PGP'],
    ['b-002', 'Ejercicio_002: SFTP con desencriptación PGP y persistencia'],
    ['b-003', 'Ejercicio_003: enrutamiento, transformación y paralelo'],
    ['b-004', 'Ejercicio_004: consumo de una cola por AMQP'],
    ['b-odata', 'Ejercicio_004: consumo dinámico de OData'],
    ['b-006', 'Ejercicio_006: envío de un IDoc al backend'],
    ['b-007', 'Ejercicio_007: consumo de una función RFC'],
    ['b-008', 'Ejercicio_008: consumo de un Web Service SOAP'],
    ['b-009', 'Ejercicio_009: procesamiento de archivos SFTP'],
    ['b-010', 'Ejercicio_010: Open Connectors'],
    ['hola', 'Hola mundo por HTTPS'],
    ['json-xml', 'Pedido JSON a XML por SFTP'],
    ['router', 'Enrutar pedidos por país'],
    ['filter', 'Filtrar productos con stock'],
    ['groovy', 'Normalizar un cliente con Groovy'],
    ['enrich', 'Enriquecer un pedido con OData'],
    ['split', 'Procesar ítems uno por uno'],
    ['errores', 'Responder con un error controlado'],
    ['mapping', 'Mapear un pedido al formato del ERP'],
  ],
};
const sapDone = () => { try { return JSON.parse(localStorage.getItem('taller-iflows-v1') || '{}').done || {}; } catch (_) { return {}; } };
const TOTAL_ESC = PA.esc.length + SAP.esc.length;

/* ---------------- Datos del usuario (en Supabase si está configurado; si no, en este navegador) ---------------- */
const KEY = 'flowdev-v1';
const blank = () => ({ progress: {}, flows: {}, quiz: {}, free: {} });
let db = { users: {}, session: null, guest: blank() };
try { const raw = localStorage.getItem(KEY); if (raw) db = { ...db, ...JSON.parse(raw) }; } catch (_) {}
/* Cuentas en Supabase: si config.js tiene url y anonKey, el avance de cada usuario se guarda en la tabla progress */
const SBC = window.FLOWDEV_SUPABASE || {}, sb = SBC.url && SBC.anonKey && window.supabase ? window.supabase.createClient(SBC.url, SBC.anonKey) : null;
let cloud = null, syncT = null;
const pick = o => ({ progress: o.progress || {}, flows: o.flows || {}, quiz: o.quiz || {}, free: o.free || {} });
const merge = (a, b) => ({ progress: { ...a.progress, ...b.progress }, flows: { ...a.flows, ...b.flows }, quiz: { ...a.quiz, ...b.quiz }, free: { ...a.free, ...b.free } });
async function pushCloud() {
  if (!sb || !cloud) return;
  const { error } = await sb.from('progress').upsert({ user_id: cloud.id, data: pick(cloud), updated_at: new Date().toISOString() });
  if (error) toast('No se pudo guardar el avance en la nube: ' + error.message);
}
const persist = () => {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {}
  if (cloud) { clearTimeout(syncT); syncT = setTimeout(pushCloud, 800); }
};
async function loadCloud(user) {
  const { data: row, error } = await sb.from('progress').select('data').eq('user_id', user.id).maybeSingle();
  if (error) { toast('No se pudo leer tu avance: ' + error.message); return; }
  const remote = pick(row?.data || {}), local = pick(db.guest);
  cloud = { id: user.id, email: user.email, name: user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0], ...merge(remote, local) };
  db.guest = blank(); db.session = null;
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {}
  if (Object.keys(local.progress).length || !row) await pushCloud();
}
const me = () => cloud || (!sb && db.session && db.users[db.session]) || null;
const data = () => me() || db.guest;
async function hash(text) {
  if (window.crypto?.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  let h = 5381; for (const ch of text) h = (Math.imul(h, 33) ^ ch.charCodeAt(0)) >>> 0; return 'x' + h.toString(16);
}
const mark = k => { if (!data().progress[k]) { data().progress[k] = true; persist(); } };

/* ---------------- Vistas: inicio, cuenta y Mi avance ---------------- */
const state = { view: 'home', auth: 'registro' };
const view = $('#view');
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); }
function go(v, extra = {}) { Object.assign(state, { view: v }, extra); render(); window.scrollTo(0, 0); }

function renderNav() {
  document.querySelectorAll('#navLinks [data-go]').forEach(b => {
    if (b.dataset.go === state.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  const u = me();
  $('#navUser').replaceChildren(u
    ? tpl('tplNavIn', { initial: u.name.trim()[0]?.toUpperCase() || '?', firstName: u.name.split(' ')[0] })
    : tpl('tplNavOut'));
}

/* ---------------- Landing: qué es flowDev y carrusel infinito de plataformas ---------------- */
// Mecanismo: tres copias del set, se centra la tarjeta elegida (track en translateX), foco 1 / 0.5 / 0.2,
// y al salir del set del medio se rebasa sin transición al índice equivalente.
// Las tarjetas están en index.html (<template id="tplHome">): acá se numeran, se arman los puntos
// y se agregan dos copias del set (antes y después) para el bucle infinito.
function buildCarousel(root) {
  const track = $('.lc-track', root), base = [...track.children], n = base.length, pad = x => String(x).padStart(2, '0');
  const copy = () => base.map(s => { const c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.setAttribute('inert', ''); return c; });
  base.forEach((s, i) => { s.dataset.i = i; $('.lc-cap', s).textContent = `${pad(i + 1)} / ${pad(n)}`; });
  const before = copy(), after = copy();
  base.forEach((s, i) => {
    const name = $('.lc-name', s).textContent;
    s.setAttribute('aria-roledescription', 'diapositiva'); s.setAttribute('aria-label', `${i + 1} de ${n}: ${name}`);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lc-dot'; b.dataset.car = 'dot'; b.dataset.i = i; b.setAttribute('aria-label', name);
    $('.lc-dots', root).append(b);
  });
  track.prepend(...before); track.append(...after);
}
let carKill = null;
function initCarousel() {
  if (carKill) { carKill(); carKill = null; }
  const rail = $('.lc-rail'); if (!rail) return;
  const track = $('.lc-track', rail), slides = [...track.children], dots = [...document.querySelectorAll(".lc-dot")], n = dots.length, status = $('#lcStatus');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idx = n, moving = false, queued = null, timer = null, drag = null, suppressClick = false;
  const center = i => rail.clientWidth / 2 - slides[i].offsetLeft - slides[i].offsetWidth / 2;
  const anim = on => { track.style.transition = on && !reduce ? 'transform 500ms ease' : 'none'; slides.forEach(s => { s.style.transition = on && !reduce ? 'opacity 300ms ease-in-out' : 'none'; }); };
  const paint = () => {
    slides.forEach((s, i) => { const d = Math.abs(i - idx); s.style.opacity = d === 0 ? 1 : d === 1 ? 0.5 : 0.2; });
    const l = ((idx % n) + n) % n;
    dots.forEach((d, i) => d.setAttribute('aria-current', i === l ? 'true' : 'false'));
    status.textContent = `Plataforma ${l + 1} de ${n}: ${dots[l].getAttribute("aria-label")}`;
  };
  const place = (dx = 0) => { track.style.transform = `translateX(${center(idx) + dx}px)`; };
  const rebase = () => { if (idx >= n && idx < 2 * n) return; idx = ((idx % n) + n) % n + n; anim(false); place(); paint(); void track.offsetWidth; anim(true); };
  const settle = () => { clearTimeout(timer); timer = null; moving = false; rebase(); if (queued) { const q = queued; queued = null; q(); } };
  function go(target) {
    if (moving) { queued = () => go(target); return; }
    if (target === idx) { place(); return; }
    idx = target; paint(); place();
    if (reduce) { rebase(); return; }
    moving = true; timer = setTimeout(settle, 900);
  }
  const step = d => { if (moving) { queued = () => go(idx + d); return; } go(idx + d); };
  const toLogical = l => { if (moving) { queued = () => toLogical(l); return; } const cur = ((idx % n) + n) % n; go(idx + (l - cur)); };
  // Entradas
  const onClick = e => {
    const b = e.target.closest('[data-car]'); if (!b) return;
    const a = b.dataset.car;
    if (a === 'prev') step(-1); else if (a === 'next') step(1); else if (a === 'dot') toLogical(+b.dataset.i);
    else if (a === 'reset') { queued = null; clearTimeout(timer); moving = false; idx = n; anim(false); place(); paint(); void track.offsetWidth; anim(true); }
  };
  const nav = $('.lc-nav'); nav.addEventListener('click', onClick);
  const onEnd = e => { if (e.target === track && e.propertyName === 'transform' && moving) settle(); };
  track.addEventListener('transitionend', onEnd);
  const onKey = e => {
    if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Home') toLogical(0); else if (e.key === 'End') toLogical(n - 1); else return;
    e.preventDefault();
  };
  rail.addEventListener('keydown', onKey);
  const down = e => {
    if (moving || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, on: false };
  };
  const move = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return;
      drag.on = true; try { rail.setPointerCapture(e.pointerId); } catch (_) {} anim(false);
    }
    place(dx);
  };
  const up = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, was = drag.on; drag = null;
    if (!was) return;
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
    anim(true);
    if (Math.abs(dx) > rail.clientWidth / 5) go(idx + (dx < 0 ? 1 : -1)); else place();
  };
  const cancel = () => { if (drag?.on) { anim(true); place(); } drag = null; };
  const eatClick = e => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } };
  rail.addEventListener('pointerdown', down); rail.addEventListener('pointermove', move); rail.addEventListener('pointerup', up);
  rail.addEventListener('pointercancel', cancel); rail.addEventListener('lostpointercapture', cancel); rail.addEventListener('click', eatClick, true);
  const ro = new ResizeObserver(() => { if (!drag?.on) { anim(false); place(); void track.offsetWidth; anim(true); } });
  ro.observe(rail);
  // Primera posición sin transición; se recalcula cuando cargan las fuentes
  anim(false); place(); paint(); void track.offsetWidth; anim(true);
  document.fonts?.ready.then(() => { if (rail.isConnected) { anim(false); place(); void track.offsetWidth; anim(true); } });
  carKill = () => { clearTimeout(timer); queued = null; ro.disconnect(); };
}
function home() {
  const f = tpl('tplHome', { user: me(),
    sapEsc: SAP.esc.length, sapQz: SAP.quizzes, paEsc: PA.esc.length, paQz: PA.quizzes });
  buildCarousel(f);
  return f;
}

function auth() {
  const reg = state.auth === 'registro', f = tpl('tplAuth', { reg, sb, forgot: !!sb && !reg, totalEsc: TOTAL_ESC });
  f.querySelectorAll('.tabs [data-auth]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.auth === state.auth)));
  $('#au_pass', f).autocomplete = reg ? 'new-password' : 'current-password';
  return f;
}

// Avance por plataforma: teoría, escenarios y cuestionarios (el taller de SAP CPI guarda su avance aparte)
function stats() {
  const pr = data().progress, sd = sapSolved(), cnt = (n, f) => Array.from({ length: n }, (_, i) => i).filter(f).length;
  const nextPa = PA.esc.find(([id]) => !pr[`pa:P:${id}`]), nextSap = SAP.esc.find(([id]) => !sd[id]);
  return [
    { name: 'Power Automate', tag: 'Cloud flows', href: PA.href, rows: [
      ['Teoría', cnt(PA.lessons, i => pr[`pa:L${i}`]), PA.lessons],
      ['Escenarios', PA.esc.filter(([id]) => pr[`pa:P:${id}`]).length, PA.esc.length],
      ['Cuestionarios', cnt(PA.quizzes, i => pr[`pa:Q:c${i + 1}`]), PA.quizzes]],
      next: nextPa ? { label: nextPa[1], href: `${PA.href}#ejercicio=${nextPa[0]}` } : null },
    { name: 'SAP CPI', tag: 'iFlows', href: SAP.href, rows: [
      ['Teoría', cnt(SAP.lessons, i => pr[`sap:L${i}`]), SAP.lessons],
      ['Escenarios', SAP.esc.filter(([id]) => sd[id]).length, SAP.esc.length],
      ['Cuestionarios', cnt(SAP.quizzes, i => sd[`q-c${i + 1}`]), SAP.quizzes]],
      next: nextSap ? { label: nextSap[1], href: `${SAP.taller}#${nextSap[0]}` } : null },
  ].map(p => ({ ...p, done: p.rows.reduce((a, r) => a + r[1], 0), total: p.rows.reduce((a, r) => a + r[2], 0) }));
}
// Recuperar contraseña (view 'olvido') y elegir una nueva (view 'clave': desde el enlace del email o desde Mi avance)
function pass() {
  const ask = state.view === 'olvido';
  return tpl('tplPass', { ask, passErr: state.passMsg || '' });
}
function dash() {
  const u = me(), st = stats(), done = st.reduce((a, p) => a + p.done, 0), total = st.reduce((a, p) => a + p.total, 0), pc = Math.round(done / total * 100);
  const f = tpl('tplDash', { user: u, canPass: !!(sb && cloud), firstName: u?.name.split(' ')[0], pc, done, total });
  meter($('[data-meter]', f), done, total);
  $('.dash-mini', f).append(...st.map(p => {
    const m = tpl('tplDashMini', { name: p.name, pc: Math.round(p.done / p.total * 100) });
    meter($('[data-meter]', m), p.done, p.total); return m;
  }));
  $('.dash-grid', f).append(...st.map(p => {
    const c = tpl('tplDashCard', { ...p, nextLabel: p.next?.label, nextHref: p.next?.href });
    $('.dash-rows', c).append(...p.rows.map(([label, d, t]) => {
      const r = tpl('tplDashRow', { label, done: d, total: t });
      meter($('[data-meter]', r), d, t); return r;
    }));
    return c;
  }));
  return f;
}

/* ---------------- Render y eventos ---------------- */
// El taller de iFlows guarda lo resuelto en su propio localStorage: se copia al avance de la cuenta
// (sap:P:<id> para escenarios, sap:Q:c<n> para cuestionarios) para que cuente en otros dispositivos y en el panel.
// Lo resuelto en el taller: lo de este navegador más lo guardado en la cuenta
const sapSolved = () => {
  const sd = { ...sapDone() };
  for (const k of Object.keys(data().progress)) {
    if (k.startsWith('sap:P:')) sd[k.slice(6)] = true; else if (k.startsWith('sap:Q:')) sd['q-' + k.slice(6)] = true;
  }
  return sd;
};
const syncSap = () => {
  const d = sapDone(), pr = data().progress; let changed = false;
  for (const id of Object.keys(d)) {
    if (!d[id] || id === 'libre') continue;
    const k = id.startsWith('q-') ? `sap:Q:${id.slice(2)}` : `sap:P:${id}`;
    if (!pr[k]) { pr[k] = true; changed = true; }
  }
  if (changed) persist();
};
function render() {
  syncSap();
  renderNav();
  $('.shell').classList.toggle('full', state.view === 'home');
  if ((state.view === 'olvido' || state.view === 'clave') && !sb) state.view = 'auth';
  if (state.view === 'clave' && !cloud && !state.recovery) state.view = 'auth';
  view.replaceChildren({ home, auth, dash, olvido: pass, clave: pass }[state.view]());
  state.passMsg = '';
  if (state.view === 'home') initCarousel(); else if (carKill) { carKill(); carKill = null; }
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-go],[data-auth],[data-act]'); if (!el) return;
  const d = el.dataset;
  if (d.go) return go(d.go);
  if (d.auth) return go('auth', { auth: d.auth });
  switch (d.act) {
    case 'google': sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }).then(({ error }) => { if (error) toast('No se pudo ingresar con Google: ' + error.message); }); return;
    case 'logout': if (cloud) { clearTimeout(syncT); pushCloud().finally(() => sb.auth.signOut()); cloud = null; } db.session = null; persist(); toast('Sesión cerrada.'); return go('home');
  }
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'passForm') return;
  e.preventDefault();
  const err = $('#passErr'), ok = $('#passOk'), btn = e.target.querySelector('[type="submit"]');
  err.textContent = ''; ok.textContent = '';
  if (state.view === 'olvido') {
    const email = $('#pw_email').value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Escribí un email válido.'; return; }
    btn.disabled = true;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    btn.disabled = false;
    // El mismo mensaje exista o no la cuenta, para no revelar qué emails están registrados
    if (error && !/not found/i.test(error.message)) { err.textContent = /rate|seconds/i.test(error.message) ? 'Pediste varios enlaces seguidos. Esperá un minuto y probá de nuevo.' : error.message; return; }
    ok.textContent = 'Si hay una cuenta con ese email, te llega un enlace en unos minutos. Revisá también el correo no deseado.';
    return;
  }
  const pw = $('#pw_new').value, rp = $('#pw_rep').value;
  if (pw.length < 8) { err.textContent = 'La contraseña tiene que tener al menos 8 caracteres.'; return; }
  if (pw !== rp) { err.textContent = 'Las contraseñas no coinciden.'; return; }
  btn.disabled = true;
  const { error } = await sb.auth.updateUser({ password: pw });
  btn.disabled = false;
  if (error) { err.textContent = /session/i.test(error.message) ? 'El enlace no es válido o venció. Pedí uno nuevo desde «¿Olvidaste tu contraseña?».' : /different|same/i.test(error.message) ? 'La contraseña nueva tiene que ser distinta de la anterior.' : /reauth|recent/i.test(error.message) ? 'Por seguridad, cerrá sesión, volvé a ingresar y cambiala de nuevo.' : error.message; return; }
  state.recovery = false; toast('Contraseña actualizada.'); go('dash');
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'authForm') return;
  e.preventDefault();
  const err = $('#authErr'), email = $('#au_email').value.trim().toLowerCase(), pass = $('#au_pass').value, reg = state.auth === 'registro';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Escribí un email válido.'; return; }
  if (pass.length < (reg ? 8 : 6)) { err.textContent = `La contraseña tiene que tener al menos ${reg ? 8 : 6} caracteres.`; return; }
  if (sb) {
    const btn = e.target.querySelector('[type="submit"]'); btn.disabled = true; err.textContent = '';
    try {
      if (reg) {
        const name = $('#au_name').value.trim();
        if (!name) { err.textContent = 'Escribí tu nombre.'; return; }
        const { data: r, error } = await sb.auth.signUp({ email, password: pass, options: { data: { name }, emailRedirectTo: location.origin + location.pathname } });
        if (error) { err.textContent = error.message; return; }
        if (!r.session) { err.textContent = 'Te enviamos un email para confirmar la cuenta. Después de confirmarla, ingresá.'; return; }
        await loadCloud(r.user); toast(`Cuenta creada. Hola, ${name.split(' ')[0]}.`); return go('dash');
      }
      const { data: r, error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) { err.textContent = /invalid/i.test(error.message) ? 'El email o la contraseña no son correctos.' : error.message; return; }
      await loadCloud(r.user); toast(`Hola de nuevo, ${cloud.name.split(' ')[0]}.`); return go('dash');
    } finally { btn.disabled = false; }
  }
  if (reg) {
    const name = $('#au_name').value.trim();
    if (!name) { err.textContent = 'Escribí tu nombre.'; return; }
    if (db.users[email]) { err.textContent = 'Ya hay una cuenta con ese email en este navegador. Ingresá.'; return; }
    const salt = uid() + uid();
    db.users[email] = { name, email, salt, hash: await hash(salt + pass), ...clone(db.guest) };
    db.guest = blank(); db.session = email; persist(); toast(`Cuenta creada. Hola, ${name.split(' ')[0]}.`); return go('dash');
  }
  const u = db.users[email];
  if (!u || u.hash !== await hash(u.salt + pass)) { err.textContent = 'El email o la contraseña no coinciden con una cuenta de este navegador.'; return; }
  db.session = email; persist(); toast(`Hola de nuevo, ${u.name.split(' ')[0]}.`); go('dash');
});
// Las otras páginas enlazan a #registro, #ingreso y #avance; #sap es el enlace viejo a SAP CPI
const fromHash = () => {
  const h = location.hash.slice(1);
  if (/(^|&)type=recovery(&|$)/.test(h)) { state.recovery = true; state.view = 'clave'; render(); return; }
  if (/(^|&)error_code=/.test(h)) { state.view = 'olvido'; state.passMsg = 'El enlace venció o ya se usó. Pedí uno nuevo.'; history.replaceState(null, '', location.pathname); render(); return; }
  if (h === 'sap') { location.replace(SAP.href); return; }
  if (h === 'registro' || h === 'ingreso') Object.assign(state, { view: 'auth', auth: h });
  else if (h === 'avance') state.view = 'dash';
  else state.view = 'home';
  render();
};
window.addEventListener('hashchange', fromHash);
fromHash();
if (sb) {
  sb.auth.getSession().then(async ({ data: { session } }) => { if (session) { await loadCloud(session.user); render(); } });
  sb.auth.onAuthStateChange((ev, session) => {
    if (ev === 'PASSWORD_RECOVERY') { state.recovery = true; state.view = 'clave'; }
    if ((ev === 'SIGNED_IN' || ev === 'PASSWORD_RECOVERY') && session && !cloud) loadCloud(session.user).then(render);
    else if (ev === 'PASSWORD_RECOVERY') render();
  });
}
})();
