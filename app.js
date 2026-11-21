(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const short = (s, n = 80) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n) + '…' : s; };

/* ---------------- Íconos ---------------- */
const IC = {
  webhook: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  formsIn: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  instant: '<rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M10 17.5h4"/><path d="M10 9l4 2-4 2z"/>',
  if: '<path d="M4 12h6M10 12l6-6h4M10 12l6 6h4"/>',
  router: '<path d="M4 12h5M9 12l6-7h5M9 12h11M9 12l6 7h5"/>',
  http: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/>',
  approval: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  sheets: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 10h16M4 15h16M10 4v16"/>',
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
};
const svg = (k, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${IC[k] || IC.arrow}</svg>`;

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
const TOTAL_ESC = PA.esc.length + SAP.esc.length, TOTAL_LES = PA.lessons + SAP.lessons, TOTAL_QZ = PA.quizzes + SAP.quizzes;

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
  const links = [['home', 'Inicio'], [SAP.href, 'SAP CPI'], [PA.href, 'Power Automate'], ['dash', 'Mi avance']];
  $('#navLinks').innerHTML = links.map(([k, l]) => k.includes('/') ? `<a href="${k}">${l}</a>` : `<button type="button" data-go="${k}"${state.view === k ? ' aria-current="page"' : ''}>${l}</button>`).join('');
  const u = me();
  $('#navUser').innerHTML = u
    ? `<span class="chip"><i>${esc(u.name.trim()[0]?.toUpperCase() || '?')}</i>${esc(u.name.split(' ')[0])}</span><button type="button" class="btn line sm" data-act="logout">Salir</button>`
    : `<button type="button" class="btn line sm" data-auth="ingreso">Ingresar</button><button type="button" class="btn sky sm" data-auth="registro">Crear cuenta</button>`;
}

/* ---------------- Landing: qué es flowDev y carrusel infinito de plataformas ---------------- */
// Mecanismo: tres copias del set, se centra la tarjeta elegida (track en translateX), foco 1 / 0.5 / 0.2,
// y al salir del set del medio se rebasa sin transición al índice equivalente.
const LAND = [
  { name: 'SAP CPI', tag: 'iFlows · integración empresarial', text: 'Conectá sistemas SAP y no SAP con iFlows en notación BPMN: adaptadores, mapeos, Groovy y manejo de errores.', meta: () => `${SAP.esc.length} escenarios · ${SAP.quizzes} cuestionarios`, href: SAP.href, w: 'min(78cqw, 420px)' },
  { name: 'Power Automate', tag: 'Cloud flows · automatización', text: 'Automatizá procesos de Microsoft 365: Outlook, Teams, Excel, SharePoint, Dataverse, aprobaciones, AI Builder y RPA.', meta: () => `${PA.esc.length} escenarios · ${PA.quizzes} cuestionarios`, href: PA.href, w: 'min(70cqw, 380px)' },
  { name: 'MuleSoft', tag: 'Próximamente', text: 'Integración y APIs de Salesforce: flows de Mule, conectores y transformaciones con DataWeave.', meta: () => 'En preparación', w: 'min(74cqw, 400px)' },
  { name: 'KNIME', tag: 'Próximamente', text: 'Workflows de nodos para preparar, analizar y transformar datos sin programar.', meta: () => 'En preparación', w: 'min(66cqw, 360px)' },
];
function landing() {
  const slide = (s, i, copy) => `<li class="lc-slide${s.href ? '' : ' soon'}" data-i="${i}" style="width:${s.w}"${copy !== 1 ? ' aria-hidden="true" inert' : ` aria-roledescription="diapositiva" aria-label="${i + 1} de ${LAND.length}: ${esc(s.name)}"`}>
      <div class="lc-card"><span class="pill">${esc(s.tag)}</span><h3 class="lc-name">${esc(s.name)}</h3><p>${esc(s.text)}</p>
      <div class="lc-foot"><span class="lc-meta">${esc(s.meta())}</span>${s.href ? `<a class="btn sky sm" href="${s.href}">Entrar</a>` : ''}</div></div>
      <span class="lc-cap">${String(i + 1).padStart(2, '0')} / ${String(LAND.length).padStart(2, '0')}</span></li>`;
  return `<section class="card flush split landing">
    <div class="side">
      <p class="eyebrow dim">Qué es flowDev</p>
      <h1 class="display">Aprendé a automatizar con el software que usan las empresas</h1>
      <p class="lead">SAP CPI, Power Automate y las demás plataformas de integración requieren licencias pagas: es difícil practicarlas fuera de un trabajo. flowDev las simula en el navegador para que puedas aprender, practicar y demostrar lo que sabés.</p>
    </div>
    <div class="side dark">
      <ol class="lc-steps">
        <li><b>Aprendé</b><span>Clases cortas de teoría, de los conceptos básicos a la gobernanza.</span></li>
        <li><b>Practicá</b><span>Talleres que imitan cada herramienta: paleta, lienzo y propiedades.</span></li>
        <li><b>Verificá</b><span>Cada escenario se prueba con datos reales simulados y te dice qué falta.</span></li>
        <li><b>Repasá</b><span>Cuestionarios por clase y modo libre para experimentar.</span></li>
      </ol>
    </div>
  </section>
  <section class="card lc" aria-labelledby="lcTitle">
    <h2 class="sr-only" id="lcTitle">Plataformas de flowDev</h2>
    <div class="lc-rail" tabindex="0" role="region" aria-roledescription="carrusel" aria-label="Plataformas de flowDev. Usá las flechas para cambiar.">
      <ul class="lc-track">${[0, 1, 2].map(c => LAND.map((s, i) => slide(s, i, c)).join('')).join('')}</ul>
    </div>
    <div class="lc-nav">
      <button type="button" class="lc-btn" data-car="prev" aria-label="Plataforma anterior">‹</button>
      <div class="lc-dots" role="group" aria-label="Elegir plataforma">${LAND.map((s, i) => `<button type="button" class="lc-dot" data-car="dot" data-i="${i}" aria-label="${esc(s.name)}"></button>`).join('')}</div>
      <button type="button" class="lc-btn" data-car="next" aria-label="Plataforma siguiente">›</button>
      <button type="button" class="btn line sm lc-reset" data-car="reset">Reiniciar</button>
    </div>
    <p class="sr-only" aria-live="polite" id="lcStatus"></p>
  </section>`;
}
let carKill = null;
function initCarousel() {
  if (carKill) { carKill(); carKill = null; }
  const rail = $('.lc-rail'); if (!rail) return;
  const track = $('.lc-track', rail), slides = [...track.children], n = LAND.length, dots = [...document.querySelectorAll('.lc-dot')], status = $('#lcStatus');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idx = n, moving = false, queued = null, timer = null, drag = null, suppressClick = false;
  const center = i => rail.clientWidth / 2 - slides[i].offsetLeft - slides[i].offsetWidth / 2;
  const anim = on => { track.style.transition = on && !reduce ? 'transform 500ms ease' : 'none'; slides.forEach(s => { s.style.transition = on && !reduce ? 'opacity 300ms ease-in-out' : 'none'; }); };
  const paint = () => {
    slides.forEach((s, i) => { const d = Math.abs(i - idx); s.style.opacity = d === 0 ? 1 : d === 1 ? 0.5 : 0.2; });
    const l = ((idx % n) + n) % n;
    dots.forEach((d, i) => d.setAttribute('aria-current', i === l ? 'true' : 'false'));
    status.textContent = `Plataforma ${l + 1} de ${n}: ${LAND[l].name}`;
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
  const u = me();
  return `${landing()}
  <section class="card flush split">
    <div class="side">
      <h1 class="display">Practicá el software de flujos que usan las empresas</h1>
      <div><span class="pill">SAP CPI · Power Automate</span></div>
      <p class="lead">Las plataformas de integración y automatización empresarial no se pueden usar libremente sin una licencia. flowDev te deja practicarlas con talleres que imitan cada herramienta, proyectos guiados y un simulador que revisa tu flujo paso a paso.</p>
      <div class="row">${u ? `<button class="btn" data-go="dash">Seguir donde quedé</button>` : `<button class="btn" data-auth="registro">Crear cuenta gratis</button><a class="btn line" href="${PA.href}">Probar sin cuenta</a>`}</div>
    </div>
    <div class="side dark">
      <div class="tiles stats">
        <div class="tile"><span class="big">2</span><p>plataformas empresariales y 2 más en camino</p></div>
        <div class="tile grey">${svg('router')}<p>${TOTAL_ESC} proyectos y ejercicios con verificación</p></div>
        <div class="tile grey">${svg('formsIn')}<p>${TOTAL_LES} clases cortas, sin relleno</p></div>
        <div class="tile"><span class="big">${TOTAL_QZ}</span><p>cuestionarios para repasar</p></div>
      </div>
    </div>
  </section>


  <section class="card dark flush split">
    <div class="side">
      <h2 class="display">Ruta de aprendizaje</h2>
      <div><span class="pill">por etapa</span></div>
      <p class="lead dim">Cada plataforma sigue el mismo recorrido. Avanzás de entender los conceptos a resolver un caso real con una API.</p>
    </div>
    <div class="side">
      <ol class="rpath">
        <li>${svg('formsIn')}<b>Conceptos</b><span>Lecciones</span></li>
        <li>${svg('webhook')}<b>Primer flujo</b><span>Inicial</span></li>
        <li>${svg('if')}<b>Lógica</b><span>Intermedio</span></li>
        <li>${svg('http')}<b>APIs y listas</b><span>Avanzado</span></li>
      </ol>
    </div>
  </section>

  <section class="card proc">
    <div class="proc-head">
      <h2 class="display">Cómo se practica</h2>
      <p class="lead">Cada escenario sigue el mismo proceso, igual que en un proyecto real: del requerimiento a un flujo que pasa todas las pruebas.</p>
    </div>
    <ol class="proc-steps">
      <li><span class="proc-n">01</span>${svg('formsIn')}<b>Leé el escenario</b><p>Requisitos, datos de ejemplo y pistas, como un pedido de un cliente.</p></li>
      <li><span class="proc-n">02</span>${svg('router')}<b>Armá el flujo</b><p>Arrastrá triggers y acciones de la paleta y configurá sus propiedades.</p></li>
      <li><span class="proc-n">03</span>${svg('instant')}<b>Ejecutá</b><p>Probalo con datos de prueba y mirá qué entra y sale de cada paso.</p></li>
      <li><span class="proc-n">04</span>${svg('approval')}<b>Verificá</b><p>Las pruebas automáticas te dicen qué funciona y qué falta.</p></li>
    </ol>
    <p class="proc-foot"><span class="pill">Solución</span> Si te trabás, cargás la respuesta y la estudiás paso a paso.</p>
  </section>`;
}

function auth() {
  const reg = state.auth === 'registro';
  return `<section class="card flush split">
    <div class="side dark">
      <h1 class="display">${reg ? 'Creá tu cuenta' : 'Volvé a tu avance'}</h1>
      <div><span class="pill">gratis</span></div>
      <p class="lead dim">${reg ? 'Guardá tus flujos, tus respuestas y tu progreso en cada plataforma.' : 'Ingresá para seguir con tus proyectos donde los dejaste.'}</p>
      <div class="tiles" style="margin-top:auto">
        <div class="tile"><span class="big">${TOTAL_ESC}</span><p>proyectos para resolver</p></div>
        <div class="tile grey">${svg('sheets')}<p>${sb ? 'Tu avance queda guardado en tu cuenta' : 'Tu avance queda guardado en este navegador'}</p></div>
      </div>
    </div>
    <div class="side">
      <div class="tabs" role="tablist"><button type="button" data-auth="registro" aria-selected="${reg}">Crear cuenta</button><button type="button" data-auth="ingreso" aria-selected="${!reg}">Ingresar</button></div>
      ${sb ? `<button type="button" class="btn line" data-act="google" style="width:100%;justify-content:center;margin-bottom:14px"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 01-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0012 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 010-4.6V6.6H1.3a12 12 0 000 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 001.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"/></svg> Continuar con Google</button><p class="note" style="text-align:center;margin-bottom:10px">o con tu email</p>` : ''}
      <form id="authForm" novalidate>
        ${reg ? `<label class="fld"><span>Nombre</span><input id="au_name" autocomplete="name" required></label>` : ''}
        <label class="fld"><span>Email</span><input id="au_email" type="email" autocomplete="email" required></label>
        <label class="fld"><span>Contraseña</span><input id="au_pass" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" minlength="6" required></label>
        <p class="err" id="authErr" role="alert"></p>
        <div class="row"><button class="btn" type="submit">${reg ? 'Crear cuenta' : 'Ingresar'}</button><a class="btn line" href="${PA.href}">Seguir sin cuenta</a></div>
      </form>
      ${sb ? '<p class="note">Tu cuenta y tu avance se guardan en la nube: podés seguir desde cualquier dispositivo.</p>' : '<p class="note">Las cuentas de flowDev se guardan solo en este navegador: no se envía nada a un servidor y no sirven en otro dispositivo. No uses una contraseña que uses en otros sitios.</p>'}
    </div>
  </section>`;
}

// Avance por plataforma: teoría, escenarios y cuestionarios (el taller de SAP CPI guarda su avance aparte)
function stats() {
  const pr = data().progress, sd = sapDone(), cnt = (n, f) => Array.from({ length: n }, (_, i) => i).filter(f).length;
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
function dash() {
  const u = me(), st = stats(), done = st.reduce((a, p) => a + p.done, 0), total = st.reduce((a, p) => a + p.total, 0), pc = Math.round(done / total * 100);
  const bar = (d, t) => `<div class="meter"><span style="width:${t ? Math.round(d / t * 100) : 0}%"></span></div>`;
  return `<section class="card flush split dash-head">
    <div class="side">
      <p class="eyebrow dim">Mi avance</p>
      <h1 class="display">${u ? 'Hola, ' + esc(u.name.split(' ')[0]) : 'Tu avance'}</h1>
      <p class="lead">${u ? 'Tu progreso se guarda en tu cuenta: seguí desde cualquier dispositivo.' : 'Estás practicando sin cuenta: el avance queda solo en este navegador y ves 3 clases y 2 cuestionarios por plataforma.'}</p>
      ${u ? '' : '<div class="row"><button class="btn" data-auth="registro">Crear cuenta gratis</button><button class="btn line" data-auth="ingreso">Ingresar</button></div>'}
    </div>
    <div class="side dark">
      <div class="dash-total"><span class="dash-pc">${pc}<small>%</small></span><span class="dim">${done} de ${total} completados</span></div>
      ${bar(done, total)}
      <div class="dash-mini">${st.map(p => `<div><span>${p.name}</span><b>${Math.round(p.done / p.total * 100)}%</b>${bar(p.done, p.total)}</div>`).join('')}</div>
    </div>
  </section>
  <section class="grid2 dash-grid">${st.map(p => `<article class="card dash-card">
      <div class="row" style="justify-content:space-between"><span class="pill">${p.tag}</span><span class="dim">${p.done}/${p.total}</span></div>
      <h2 class="h2">${p.name}</h2>
      <ul class="dash-rows">${p.rows.map(([l, d, t]) => `<li><span>${l}</span><span class="dim">${d}/${t}</span>${bar(d, t)}</li>`).join('')}</ul>
      <div class="dash-next">${p.next ? `<p class="dim">Siguiente</p><p class="h3">${esc(p.next.label)}</p>` : '<p class="h3">Completaste todos los escenarios.</p>'}
      <div class="row">${p.next ? `<a class="btn" href="${p.next.href}">Continuar</a>` : ''}<a class="btn line" href="${p.href}">Ver ${p.name}</a></div></div>
    </article>`).join('')}</section>`;
}

/* ---------------- Render y eventos ---------------- */
function render() {
  renderNav();
  $('.shell').classList.toggle('full', state.view === 'home');
  view.innerHTML = { home, auth, dash }[state.view]();
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
  if (e.target.id !== 'authForm') return;
  e.preventDefault();
  const err = $('#authErr'), email = $('#au_email').value.trim().toLowerCase(), pass = $('#au_pass').value, reg = state.auth === 'registro';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Escribí un email válido.'; return; }
  if (pass.length < 6) { err.textContent = 'La contraseña tiene que tener al menos 6 caracteres.'; return; }
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
  sb.auth.onAuthStateChange((ev, session) => { if (ev === 'SIGNED_IN' && session && !cloud) loadCloud(session.user).then(render); });
}
})();
