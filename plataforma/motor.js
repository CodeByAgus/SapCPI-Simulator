/* flowDev · motor compartido de las plataformas con tickets (BTP, ABAP, S/4HANA, KNIME, Power BI, SuccessFactors).
   Cada plataforma define window.FD_PLAT en su datos.js: clases con cuestionario, tickets de práctica y un proyecto final.
   El área de trabajo de cada ticket es de uno de tres tipos:
   - form: una pantalla de la herramienta con campos (y opcionalmente una tabla de posiciones)
   - code: un editor de código (ABAP, DAX, SQL) con una salida simulada
   - pipeline: una cadena de pasos o nodos que se agregan, ordenan y configuran
   Los criterios de verificación son funciones que reciben el estado del área de trabajo. */
(() => {
'use strict';
const P = window.FD_PLAT;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const HOME = '../index.html';
const IC = {
  doc: '<path d="M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10.5a.5.5 0 01-.5-.5V4a.5.5 0 01.5-.5z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/>',
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  medal: '<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 9.5L6 3.5h4l2 4 2-4h4l-2.5 6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
};
const ic = (k, cls = '') => `<svg viewBox="0 0 24 24" class="ic ${cls}" aria-hidden="true">${IC[k]}</svg>`;

/* ---------------- Datos del usuario: mismo formato y misma tabla que el resto de flowDev ---------------- */
const KEY = 'flowdev-v1';
const blank = () => ({ progress: {}, flows: {}, quiz: {}, free: {} });
let db = { users: {}, session: null, guest: blank() };
try { const raw = localStorage.getItem(KEY); if (raw) db = { ...db, ...JSON.parse(raw) }; } catch (_) {}
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
const pr = () => data().progress;
const mark = k => { if (!pr()[k]) { pr()[k] = true; persist(); } };
const K = { L: i => `${P.id}:L${i}`, Q: i => `${P.id}:Q:c${i + 1}`, T: id => `${P.id}:P:${id}`, F: i => `${P.id}:F:${i}` };
const FREE_LES = 3, FREE_QZ = 2;
const guest = () => !me();

const ticketsDone = () => P.tickets.filter(t => pr()[K.T(t.id)]).length;
const finalOpen = () => ticketsDone() === P.tickets.length;
const partsDone = () => P.final.parts.filter((_, i) => pr()[K.F(i)]).length;
const TOTAL = () => P.lessons.length * 2 + P.tickets.length;
const doneCount = () => P.lessons.filter((_, i) => pr()[K.L(i)]).length + P.lessons.filter((_, i) => pr()[K.Q(i)]).length + ticketsDone();

/* ---------------- Estado de la vista y navegación por hash ---------------- */
const state = { view: 'inicio', tab: 'escenarios', i: 0, tid: null, part: null, results: null, hints: 0, answers: {}, graded: false, wsTab: 0, cert: null, certErr: '' };
const view = $('#view');
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200); }
function go(v, extra = {}) {
  Object.assign(state, { view: v, results: null, hints: 0, answers: {}, graded: false, wsTab: 0 }, extra);
  const h = v === 'clase' ? `clase=${state.i}` : v === 'quiz' ? `cuestionario=${state.i}` : v === 'ticket' ? `ticket=${state.tid}` : v === 'parte' ? `final=${state.part}` : v === 'final' ? 'final' : v === 'inicio' ? `tab=${state.tab}` : '';
  history.replaceState(null, '', h ? '#' + h : location.pathname);
  render(); window.scrollTo(0, 0);
}
function fromHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.has('clase')) return go('clase', { i: +h.get('clase') || 0 });
  if (h.has('cuestionario')) return go('quiz', { i: +h.get('cuestionario') || 0 });
  if (h.has('ticket') || h.has('ejercicio')) { const id = h.get('ticket') || h.get('ejercicio'); if (P.tickets.some(t => t.id === id)) return go('ticket', { tid: id }); }
  if (h.has('final')) { const n = h.get('final'); return n === '' ? go('final') : go('parte', { part: +n || 0 }); }
  if (h.has('tab')) state.tab = h.get('tab');
  render();
}

function renderNav() {
  const links = [[HOME, 'Inicio'], [HOME + '#areas', 'Áreas'], ['../cursos/index.html', 'Cursos gratis'], [HOME + '#avance', 'Mi avance']];
  $('#navLinks').innerHTML = links.map(([href, l]) => `<a href="${href}">${l}</a>`).join('');
  const u = me();
  $('#navUser').innerHTML = u
    ? `<span class="chip"><i>${esc(u.name.trim()[0]?.toUpperCase() || '?')}</i>${esc(u.name.split(' ')[0])}</span><button type="button" class="btn line sm" data-act="logout">Salir</button>`
    : `<a class="btn line sm" href="${HOME}#ingreso">Ingresar</a><a class="btn sky sm" href="${HOME}#registro">Crear cuenta</a>`;
}

/* ---------------- Inicio de la plataforma ---------------- */
const order = q => { let s = 7; for (const ch of q[0]) s = (Math.imul(s, 31) + ch.charCodeAt(0)) >>> 0; const idx = q[1].map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const k = (s >>> 16) % (i + 1); [idx[i], idx[k]] = [idx[k], idx[i]]; } return idx; };
const photo = (p, cls = '') => p ? `<figure class="photo ${cls}"><img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy" decoding="async"><figcaption>Foto: ${p.by ? esc(p.by) + ' · ' : ''}Unsplash</figcaption></figure>` : '';
function inicio() {
  const pc = Math.round(doneCount() / TOTAL() * 100);
  const tabs = [['escenarios', `Escenarios · ${P.tickets.length}`], ['teoria', `Teoría · ${P.lessons.length}`], ['cuestionarios', `Cuestionarios · ${P.lessons.length}`], ['final', 'Proyecto final']];
  let body = '';
  if (state.tab === 'teoria') body = list(P.lessons.map((l, i) => {
    const locked = guest() && i >= FREE_LES, done = pr()[K.L(i)];
    return row({ n: String(i + 1).padStart(2, '0'), title: l.t, sub: l.sub || `${l.body.length} bloques · lectura corta`, locked, done, act: locked ? 'data-auth="registro"' : `data-go="clase" data-i="${i}"` });
  }), guest() ? `Sin cuenta podés ver ${FREE_LES} clases. <a href="${HOME}#registro">Creá una cuenta gratis</a> para ver todo y guardar tu avance.` : '');
  else if (state.tab === 'cuestionarios') body = list(P.lessons.map((l, i) => {
    const locked = guest() && i >= FREE_QZ, done = pr()[K.Q(i)];
    return row({ n: String(i + 1).padStart(2, '0'), title: `Cuestionario: ${l.t}`, sub: `${l.quiz.length} preguntas tipo entrevista`, locked, done, act: locked ? 'data-auth="registro"' : `data-go="quiz" data-i="${i}"` });
  }), guest() ? `Sin cuenta podés hacer ${FREE_QZ} cuestionarios. <a href="${HOME}#registro">Creá una cuenta gratis</a> para hacer todos.` : '');
  else if (state.tab === 'final') body = finalCard();
  else body = list(P.tickets.map((t, i) => row({ n: '#' + t.num, title: t.title, sub: `${t.from} · ${t.prio}`, done: pr()[K.T(t.id)], act: `data-go="ticket" data-tid="${t.id}"`, pill: t.level || `Escenario ${i + 1}` })));
  return `
  <section class="card hero-p">
    <div class="hero-txt">
      <p class="eyebrow"><span class="mark sm" data-mark="${P.mark}"></span>${esc(P.area)}</p>
      <h1 class="display">${esc(P.name)}</h1>
      <p class="lead">${P.blurb}</p>
      <div class="roles">${P.roles.map(r => `<span class="pill">${esc(r)}</span>`).join('')}</div>
      <div class="hero-stats">
        <div><b>${P.tickets.length}</b><span>escenarios</span></div><div><b>${P.lessons.length}</b><span>clases</span></div><div><b>${P.final.parts.length}</b><span>partes del proyecto final</span></div><div><b>~${P.hours} h</b><span>de práctica</span></div>
      </div>
      <div class="prog"><div class="meter"><span style="width:${pc}%"></span></div><span>${pc}% completado</span></div>
    </div>
    ${photo(P.photo, 'hero-ph')}
  </section>
  <section class="card">
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${state.tab === k}">${l}</button>`).join('')}</div>
    ${body}
  </section>
  ${P.context ? `<section class="card dark ctx"><div><p class="eyebrow">Para qué se usa en una empresa</p><p class="lead">${P.context}</p></div></section>` : ''}`;
}
const list = (rows, note) => `<div class="rows">${rows.join('')}</div>${note ? `<p class="note">${note}</p>` : ''}`;
const row = ({ n, title, sub, locked, done, act, pill }) => `<button type="button" class="rowi${locked ? ' locked' : ''}${done ? ' done' : ''}" ${act}>
  <span class="rn">${esc(n)}</span><span class="grow"><span class="h3">${esc(title)}</span><span class="dim">${locked ? 'Creá una cuenta gratis para verlo.' : esc(sub)}</span></span>
  ${pill ? `<span class="pill">${esc(pill)}</span>` : ''}<span class="st">${locked ? ic('lock') : done ? ic('check') : ic('arrow')}</span></button>`;

function finalCard() {
  const F = P.final, open = finalOpen(), left = P.tickets.length - ticketsDone();
  return `<div class="fin">
    <div class="fin-head">
      <div><p class="eyebrow">Proyecto final · ${esc(F.company || 'Distribuidora Andina')}</p><h2 class="h2">${esc(F.title)}</h2><p class="lead">${F.brief}</p>
      <p class="dim">${open ? `${partsDone()} de ${F.parts.length} partes aprobadas.` : `Para desbloquearlo: resolvé los ${P.tickets.length} escenarios (te faltan ${left}).`}</p></div>
      ${open ? `<button type="button" class="btn" data-go="final">${partsDone() ? 'Seguir con el proyecto' : 'Empezar el proyecto final'}</button>` : `<span class="pill">${ic('lock')} Bloqueado</span>`}
    </div>
    <ol class="parts">${F.parts.map((p, i) => `<li class="${pr()[K.F(i)] ? 'done' : ''}"><span class="rn">Parte ${i + 1}</span><b>${esc(p.title)}</b><span class="dim">Pista de estructura: ${esc(p.structure)}</span></li>`).join('')}</ol>
    <p class="note">Al aprobar las ${F.parts.length} partes recibís un <b>certificado de cumplimiento</b> con código verificable. Acredita la práctica en flowDev; no es una certificación oficial de ${esc(P.vendor)}.</p>
  </div>`;
}

/* ---------------- Clase y cuestionario ---------------- */
function clase() {
  const l = P.lessons[state.i]; if (!l) return go('inicio');
  if (guest() && state.i >= FREE_LES) return lockedView('esta clase');
  const next = P.lessons[state.i + 1];
  return `<section class="card lesson">
    <button type="button" class="back" data-go="inicio" data-tab="teoria">← Teoría de ${esc(P.name)}</button>
    <p class="eyebrow">Clase ${state.i + 1} de ${P.lessons.length}</p><h1 class="h1">${esc(l.t)}</h1>
    <div class="prose">${l.body.join('')}</div>
    <div class="row"><button type="button" class="btn" data-act="read">${pr()[K.L(state.i)] ? 'Leída ✓' : 'Marcar como leída'}</button>
    <button type="button" class="btn line" data-go="quiz" data-i="${state.i}">Hacer el cuestionario</button>
    ${next ? `<button type="button" class="btn line" data-go="clase" data-i="${state.i + 1}">Siguiente: ${esc(next.t)}</button>` : ''}</div>
  </section>`;
}
function quiz() {
  const l = P.lessons[state.i]; if (!l) return go('inicio');
  if (guest() && state.i >= FREE_QZ) return lockedView('este cuestionario');
  const qs = l.quiz, g = state.graded, right = qs.filter((q, n) => state.answers[n] === 0).length;
  return `<section class="card lesson">
    <button type="button" class="back" data-go="inicio" data-tab="cuestionarios">← Cuestionarios</button>
    <p class="eyebrow">Cuestionario ${state.i + 1} · preguntas tipo entrevista</p><h1 class="h1">${esc(l.t)}</h1>
    <ol class="qz">${qs.map((q, n) => `<li><p class="h3">${esc(q[0])}</p><div class="opts">${order(q).map(o => {
      const sel = state.answers[n] === o, cls = g ? (o === 0 ? ' ok' : sel ? ' bad' : '') : sel ? ' sel' : '';
      return `<button type="button" class="opt${cls}" data-act="ans" data-n="${n}" data-o="${o}" ${g ? 'disabled' : ''}>${esc(q[1][o])}</button>`;
    }).join('')}</div>${g ? `<p class="dim expl">${esc(q[2] || '')}</p>` : ''}</li>`).join('')}</ol>
    <div class="row">${g ? `<p class="h3">${right} de ${qs.length} correctas${right === qs.length ? ' · aprobado' : ''}</p><button type="button" class="btn line" data-act="retry">Volver a intentar</button>` : `<button type="button" class="btn" data-act="grade" ${Object.keys(state.answers).length < qs.length ? 'disabled' : ''}>Corregir</button>`}
    ${P.lessons[state.i + 1] ? `<button type="button" class="btn line" data-go="clase" data-i="${state.i + 1}">Siguiente clase</button>` : ''}</div>
  </section>`;
}
const lockedView = what => `<section class="card lesson"><button type="button" class="back" data-go="inicio">← ${esc(P.name)}</button><h1 class="h1">Creá una cuenta para ver ${what}</h1><p class="lead">Es gratis. Tu avance queda guardado y podés seguir desde cualquier dispositivo.</p><div class="row"><a class="btn" href="${HOME}#registro">Crear cuenta gratis</a><a class="btn line" href="${HOME}#ingreso">Ingresar</a></div></section>`;

/* ---------------- Ticket: pedido a la izquierda, área de trabajo al centro, verificación a la derecha ---------------- */
const curTicket = () => state.view === 'parte' ? { ...P.final.parts[state.part], num: P.final.num, from: P.final.from, prio: 'Proyecto final', final: true } : P.tickets.find(t => t.id === state.tid);
const wkey = () => state.view === 'parte' ? `${P.id}:final:${state.part}` : `${P.id}:${state.tid}`;
const initWs = ws => ({ v: clone(ws.values || {}), grid: clone(ws.grid?.start || []), code: ws.start || '', nodes: clone(ws.nodes || []) });
function ws() { const t = curTicket(), k = wkey(); if (!data().flows[k]) data().flows[k] = initWs(t.ws); return data().flows[k]; }
const norm = s => String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
const H = { norm, num: s => Number(String(s ?? '').replace(',', '.')), has: (code, re) => re.test(code.replace(/"[^"\n]*$/gm, '')), node: (s, k) => s.nodes.find(n => n.k === k), idx: (s, k) => s.nodes.findIndex(n => n.k === k) };
function evaluate(t) { const s = ws(); return t.checks.map(c => { let ok = false; try { ok = !!c.ok(s, H); } catch (_) {} return { t: c.t, ok, why: c.why || '' }; }); }

function ticket() {
  const t = curTicket(); if (!t) return go('inicio');
  if (t.final && (!finalOpen() || (state.part > 0 && !pr()[K.F(state.part - 1)]))) return go('final');
  const done = t.final ? pr()[K.F(state.part)] : pr()[K.T(t.id)];
  const res = state.results, nOk = res ? res.filter(r => r.ok).length : 0, all = res && nOk === res.length;
  const idx = t.final ? state.part : P.tickets.findIndex(x => x.id === t.id);
  return `<div class="tk">
  <header class="tk-bar">
    <span class="mark sm" data-mark="${P.mark}"></span>
    <div class="tk-ttl"><b>${esc(P.name)} · ${t.final ? 'Proyecto final' : 'Taller'}</b><span>${t.final ? `Parte ${state.part + 1} de ${P.final.parts.length}` : `Escenario ${idx + 1} de ${P.tickets.length}`} · ${esc(P.area)}</span></div>
    <span class="tk-state"><i></i>Ticket #${esc(t.num)} · ${done ? 'Resuelto' : 'En curso'}</span>
    <div class="tk-act">
      <button type="button" class="btn line sm" data-go="${t.final ? 'final' : 'inicio'}">Volver</button>
      <button type="button" class="btn line sm" data-act="hint" ${state.hints >= (t.hints || []).length ? 'disabled' : ''}>${ic('bulb')}Pedir pista</button>
      ${!t.final && t.solve ? '<button type="button" class="btn line sm" data-act="solve">Ver solución</button>' : ''}
      <button type="button" class="btn line sm" data-act="reset">Reiniciar</button>
    </div>
  </header>
  <aside class="tk-req card">
    <p class="eyebrow">${esc(P.final.company || 'Distribuidora Andina')} · Mesa de ayuda</p>
    <div class="row sb"><span class="mono">#${esc(t.num)}</span><span class="pill sky">${esc(t.prio)}</span></div>
    <h1 class="h2">${esc(t.title)}</h1>
    <dl class="meta"><dt>Solicitante</dt><dd>${esc(t.from)}</dd><dt>Asignado a</dt><dd>Vos · ${esc(P.role)}</dd><dt>Sistema</dt><dd>${esc(t.system || P.name)}</dd></dl>
    <h2 class="h4">Descripción</h2><p class="dim">${t.desc}</p>
    <h2 class="h4">Requisitos</h2><ol class="reqs">${t.reqs.map(r => `<li>${r}</li>`).join('')}</ol>
    ${t.final && t.why ? `<h2 class="h4">Para qué se usa</h2><p class="dim">${esc(t.why)}</p>` : ''}
    ${t.data ? `<h2 class="h4">Adjuntos</h2>${t.data.map(d => `<details class="att"><summary>${ic('doc')}<span class="mono">${esc(d.name)}</span></summary><pre>${esc(d.body)}</pre></details>`).join('')}` : ''}
    ${t.msg ? `<div class="msg"><span class="av">${esc(t.from.split(' ').map(w => w[0]).slice(0, 2).join(''))}</span><p><span class="dim">${esc(t.from.split('·')[0])}</span><br>${esc(t.msg)}</p></div>` : ''}
  </aside>
  <section class="tk-ws card">${workspace(t)}
    ${state.hints ? `<div class="hint"><b>Pista${t.final ? ' de estructura' : ''}</b>${t.hints.slice(0, state.hints).map(h => `<p>${h}</p>`).join('')}</div>` : t.final ? `<div class="hint"><b>Pista de estructura</b><p>${esc(t.structure)}</p></div>` : ''}
  </section>
  <aside class="tk-ver card">
    <h2 class="h2">Verificación</h2>
    <p class="dim">${res ? `${nOk} de ${res.length} criterios cumplidos` : `${t.checks.length} criterios · ejecutá la prueba`}</p>
    <div class="meter"><span style="width:${res ? Math.round(nOk / res.length * 100) : 0}%"></span></div>
    <ul class="crit">${t.checks.map((c, n) => { const r = res?.[n]; return `<li class="${r ? (r.ok ? 'ok' : 'bad') : ''}"><span class="dot">${r?.ok ? ic('check') : ''}</span><span><b>${esc(c.t)}</b>${r && !r.ok && r.why ? `<span class="dim">${esc(r.why)}</span>` : ''}</span></li>`; }).join('')}</ul>
    <button type="button" class="btn big" data-act="run">${ic('play')}Ejecutar prueba</button>
    <button type="button" class="btn line big" data-act="deliver" ${all ? '' : 'disabled'}>${done ? 'Volver a entregar' : 'Entregar ticket'}</button>
    ${res ? `<h3 class="h4">Última prueba</h3><pre class="log">${esc(runLog(t, res))}</pre>` : ''}
    <div class="tip"><b>${t.final ? 'Al aprobar esta parte' : 'Al cerrar este ticket'}</b><p>${t.final ? (state.part + 1 < P.final.parts.length ? `Se desbloquea la parte ${state.part + 2}.` : 'Recibís tu certificado de cumplimiento.') : `Sumás 1 escenario hacia el proyecto final de ${esc(P.name)} (${ticketsDone()}/${P.tickets.length}).`}</p></div>
  </aside>
  </div>`;
}
function runLog(t, res) {
  let out = '';
  if (t.ws.run) { try { out = t.ws.run(ws(), H) + '\n'; } catch (e) { out = 'Error al ejecutar: ' + e.message + '\n'; } }
  return out + res.map(r => `${r.ok ? '✓' : '✗'} ${r.t}`).join('\n');
}

function workspace(t) {
  const w = t.ws, s = ws();
  const head = `<div class="ws-head"><span class="pill">${esc(w.app || P.name)}</span><b>${esc(w.screen)}</b>${w.code ? `<span class="mono dim">${esc(w.code)}</span>` : ''}</div>`;
  if (w.type === 'code') return `${head}<div class="ed"><div class="ln" aria-hidden="true">${Array.from({ length: Math.max(14, s.code.split('\n').length + 1) }, (_, i) => i + 1).join('<br>')}</div>
    <textarea class="code" data-code spellcheck="false" aria-label="Editor de ${esc(w.lang)}">${esc(s.code)}</textarea></div>
    <p class="dim small">${esc(w.lang)} · el simulador revisa la estructura del código, no lo compila.</p>`;
  if (w.type === 'pipeline') return `${head}<div class="pl">
    <div class="pal"><p class="h4">${esc(w.paletteLabel || 'Nodos')}</p><p class="dim small">Para separar datos en la configuración podés usar · o |</p>${w.palette.map(p => `<button type="button" class="pal-i" data-act="add" data-k="${p.k}">${ic('plus')}<span>${esc(p.label)}</span>${p.cat ? `<small>${esc(p.cat)}</small>` : ''}</button>`).join('')}</div>
    <ol class="chain">${s.nodes.length ? s.nodes.map((n, i) => { const p = w.palette.find(x => x.k === n.k) || { label: n.k }; return `<li>
      <div class="node"><span class="nn">${i + 1}</span><b>${esc(p.label)}</b>
      <span class="nb"><button type="button" data-act="mv" data-i="${i}" data-d="-1" aria-label="Subir">${ic('up')}</button><button type="button" data-act="mv" data-i="${i}" data-d="1" aria-label="Bajar">${ic('down')}</button><button type="button" data-act="rm" data-i="${i}" aria-label="Quitar">${ic('x')}</button></span></div>
      ${p.cfg ? `<label class="fld cfg"><span>${esc(p.cfg.label)}</span>${input(p.cfg, n.c ?? '', `data-cfg="${i}"`)}</label>` : ''}</li>`; }).join('') : `<li class="empty">Agregá ${esc(w.paletteLabel?.toLowerCase() || 'nodos')} desde la izquierda, en el orden en que tiene que correr el proceso.</li>`}</ol></div>`;
  // form
  const tabs = w.tabs || [{ label: w.screen, fields: w.fields || [], grid: w.grid }];
  const tb = tabs[state.wsTab] || tabs[0];
  return `${head}${tabs.length > 1 ? `<div class="tabs sm">${tabs.map((x, i) => `<button type="button" data-act="wstab" data-i="${i}" aria-selected="${i === state.wsTab}">${esc(x.label)}</button>`).join('')}</div>` : ''}
    <div class="frm">${(tb.fields || []).map(f => `<label class="fld${f.wide ? ' wide' : ''}"><span>${esc(f.label)}${f.req ? ' <i>*</i>' : ''}</span>${input(f, s.v[f.k] ?? '', `data-f="${f.k}"`)}${f.help ? `<small class="dim">${esc(f.help)}</small>` : ''}</label>`).join('')}</div>
    ${tb.grid ? `<div class="grid-w"><p class="h4">${esc(tb.grid.label || 'Posiciones')}</p><table class="gt"><thead><tr>${tb.grid.cols.map(c => `<th>${esc(c.label)}</th>`).join('')}<th></th></tr></thead><tbody>
      ${s.grid.map((r, ri) => `<tr>${tb.grid.cols.map(c => `<td>${input(c, r[c.k] ?? '', `data-g="${ri}" data-c="${c.k}" aria-label="${esc(c.label)} fila ${ri + 1}"`)}</td>`).join('')}<td><button type="button" class="ib" data-act="grm" data-i="${ri}" aria-label="Quitar fila">${ic('x')}</button></td></tr>`).join('')}
    </tbody></table><button type="button" class="btn line sm" data-act="gadd">${ic('plus')}Agregar fila</button></div>` : ''}`;
}
function input(f, val, attr) {
  const v = esc(val);
  if (f.type === 'select') return `<select ${attr}><option value="">Elegí…</option>${f.opts.map(o => { const [k, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(k)}"${String(val) === String(k) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
  if (f.type === 'textarea') return `<textarea ${attr} rows="${f.rows || 3}" placeholder="${esc(f.ph || '')}">${v}</textarea>`;
  return `<input ${attr} type="${f.type === 'number' ? 'text' : f.type === 'date' ? 'date' : 'text'}" ${f.type === 'number' ? 'inputmode="decimal"' : ''} value="${v}" placeholder="${esc(f.ph || '')}" autocomplete="off">`;
}

/* ---------------- Proyecto final y certificado ---------------- */
function finalView() {
  if (!finalOpen()) return `<section class="card lesson"><button type="button" class="back" data-go="inicio" data-tab="final">← ${esc(P.name)}</button>${finalCard()}</section>`;
  const F = P.final, all = partsDone() === F.parts.length;
  return `<section class="card lesson">
    <button type="button" class="back" data-go="inicio" data-tab="final">← ${esc(P.name)}</button>
    <p class="eyebrow">Proyecto final · Ticket #${esc(F.num)} de ${esc(F.company || 'Distribuidora Andina')}</p>
    <h1 class="h1">${esc(F.title)}</h1>
    <div class="brief"><span class="av">${esc(F.from.split(' ').map(w => w[0]).slice(0, 2).join(''))}</span><div><p class="dim">${esc(F.from)}</p><p class="lead">${F.brief}</p></div></div>
    <p class="dim">${F.why}</p>
    <ol class="parts big">${F.parts.map((p, i) => { const ok = pr()[K.F(i)], open = i === 0 || pr()[K.F(i - 1)]; return `<li class="${ok ? 'done' : ''}">
      <span class="rn">Parte ${i + 1}</span><b>${esc(p.title)}</b><span class="dim">Pista de estructura: ${esc(p.structure)}</span>
      ${open ? `<button type="button" class="btn ${ok ? 'line' : ''} sm" data-go="parte" data-part="${i}">${ok ? 'Revisar' : 'Resolver'}</button>` : `<span class="pill">${ic('lock')} Después de la parte ${i}</span>`}</li>`; }).join('')}</ol>
  </section>
  ${all ? certBox() : ''}`;
}
const LS_CERT = `flowdev-cert-${P.id}`;
function certBox() {
  const c = state.cert;
  if (c) {
    const url = `${location.origin}/certificado/?c=${c.code}`, d = new Date(c.issued_at);
    const li = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent('Proyecto final ' + P.name + ' (simulador flowDev)')}&organizationName=flowDev&issueYear=${d.getFullYear()}&issueMonth=${d.getMonth() + 1}&certUrl=${encodeURIComponent(url)}&certId=${c.code}`;
    return `<section class="card dark cert-ok"><div><p class="eyebrow">${ic('medal')} Certificado emitido</p><h2 class="h1">¡Aprobaste el proyecto final!</h2>
      <p class="lead">Código <span class="mono">${esc(c.code)}</span> · a nombre de ${esc(c.full_name)}</p>
      <div class="row"><a class="btn sky" href="../certificado/?c=${c.code}">Ver certificado</a><a class="btn line" href="${li}" target="_blank" rel="noopener">Agregar a LinkedIn</a><button type="button" class="btn line" data-act="copy" data-url="${esc(url)}">Copiar enlace</button></div></div></section>`;
  }
  if (!cloud) return `<section class="card dark cert-ok"><div><p class="eyebrow">${ic('medal')} Proyecto aprobado</p><h2 class="h1">Creá una cuenta para recibir tu certificado</h2>
    <p class="lead">El certificado va a nombre de tu cuenta y queda publicado con un código verificable. Tu avance se conserva al crearla.</p>
    <div class="row"><a class="btn sky" href="${HOME}#registro">Crear cuenta gratis</a><a class="btn line" href="${HOME}#ingreso">Ingresar</a></div></div></section>`;
  return `<section class="card dark cert-ok"><div><p class="eyebrow">${ic('medal')} Proyecto aprobado</p><h2 class="h1">Emití tu certificado de cumplimiento</h2>
    <p class="lead">Revisá cómo querés que figure tu nombre: es el que va a ver quien lo verifique.</p>
    <label class="fld dark"><span>Nombre y apellido</span><input id="certName" value="${esc(cloud.name)}" maxlength="80" autocomplete="name"></label>
    ${state.certErr ? `<p class="err">${esc(state.certErr)}</p>` : ''}
    <div class="row"><button type="button" class="btn sky" data-act="issue">Emitir certificado</button></div></div></section>`;
}
const code8 = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(8)); const s = [...r].map(x => A[x % A.length]).join(''); return s.slice(0, 4) + '-' + s.slice(4); };
async function loadCert() {
  if (!cloud || !sb) return;
  const { data: c } = await sb.from('certificates').select('code,full_name,issued_at').eq('platform', P.id).maybeSingle();
  if (c) { state.cert = c; if (state.view === 'final') render(); }
}
async function issue() {
  const name = ($('#certName')?.value || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.split(' ').length < 2) { state.certErr = 'Escribí tu nombre y apellido.'; return render(); }
  if (P.final.parts.some((_, i) => !pr()[K.F(i)])) { state.certErr = 'Primero aprobá todas las partes.'; return render(); }
  const solution = { parts: P.final.parts.map((p, i) => ({ title: p.title, work: summarize(p, data().flows[`${P.id}:final:${i}`]) })) };
  for (let tries = 0; tries < 3; tries++) {
    const row = { code: code8(), user_id: cloud.id, platform: P.id, full_name: name, title: P.final.certTitle || `Proyecto final de ${P.name}`, summary: P.final.parts.map(p => p.title), solution };
    const { error } = await sb.from('certificates').insert(row);
    if (!error) { state.cert = { code: row.code, full_name: name, issued_at: new Date().toISOString() }; state.certErr = ''; toast('Certificado emitido.'); return render(); }
    if (/duplicate|unique/i.test(error.message) && /user_id|platform/i.test(error.message)) { await loadCert(); return render(); }
    if (!/duplicate|unique/i.test(error.message)) { state.certErr = /relation|does not exist|schema cache/i.test(error.message) ? 'La emisión de certificados todavía no está habilitada en este entorno. Tu proyecto quedó aprobado: volvé a intentarlo más tarde.' : 'No se pudo emitir el certificado: ' + error.message; return render(); }
  }
}
// Lo que se guarda del trabajo entregado (se muestra en la página pública del certificado)
function summarize(p, s) {
  if (!s) return [];
  const w = p.ws;
  if (w.type === 'code') return [s.code.slice(0, 6000)];
  if (w.type === 'pipeline') return s.nodes.map(n => { const q = w.palette.find(x => x.k === n.k); return `${q?.label || n.k}${n.c ? ': ' + n.c : ''}`; });
  const fields = (w.tabs || [{ fields: w.fields || [] }]).flatMap(t => t.fields || []);
  const out = fields.filter(f => s.v[f.k] !== undefined && s.v[f.k] !== '').map(f => `${f.label}: ${s.v[f.k]}`);
  (s.grid || []).forEach((r, i) => out.push(`Fila ${i + 1}: ${Object.values(r).filter(Boolean).join(' · ')}`));
  return out.slice(0, 60);
}

/* ---------------- Render y eventos ---------------- */
function render() {
  renderNav();
  document.body.classList.toggle('wide', state.view === 'ticket' || state.view === 'parte');
  const html = { inicio, clase, quiz, ticket, parte: ticket, final: finalView }[state.view]();
  if (typeof html === 'string') view.innerHTML = html;
  document.title = `${state.view === 'ticket' || state.view === 'parte' ? curTicket()?.title + ' · ' : ''}${P.name} · flowDev`;
}
function save() { persist(); }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-go],[data-tab],[data-act],[data-auth]'); if (!el) return;
  const d = el.dataset;
  if (d.auth) { location.href = `${HOME}#${d.auth}`; return; }
  if (d.go) return go(d.go, { ...(d.tab ? { tab: d.tab } : {}), ...(d.i !== undefined ? { i: +d.i } : {}), ...(d.tid ? { tid: d.tid } : {}), ...(d.part !== undefined ? { part: +d.part } : {}) });
  if (d.tab) { state.tab = d.tab; history.replaceState(null, '', '#tab=' + d.tab); return render(); }
  const t = (state.view === 'ticket' || state.view === 'parte') ? curTicket() : null;
  switch (d.act) {
    case 'logout': if (cloud) { clearTimeout(syncT); pushCloud().finally(() => sb.auth.signOut()); cloud = null; } db.session = null; persist(); toast('Sesión cerrada.'); return render();
    case 'read': mark(K.L(state.i)); toast('Clase marcada como leída.'); return render();
    case 'ans': state.answers[+d.n] = +d.o; return render();
    case 'grade': { state.graded = true; const qs = P.lessons[state.i].quiz; if (qs.every((_, n) => state.answers[n] === 0)) { mark(K.Q(state.i)); toast('¡Cuestionario aprobado!'); } return render(); }
    case 'retry': state.answers = {}; state.graded = false; return render();
    case 'hint': state.hints = Math.min((t.hints || []).length, state.hints + 1); return render();
    case 'solve': if (!confirm('Vas a reemplazar tu trabajo por la solución. El escenario no cuenta como resuelto hasta que lo entregues. ¿Seguís?')) return; Object.assign(ws(), clone(t.solve)); save(); state.results = null; return render();
    case 'reset': if (!confirm('¿Volver el área de trabajo al estado inicial?')) return; data().flows[wkey()] = initWs(t.ws); save(); state.results = null; return render();
    case 'run': state.results = evaluate(t); return render();
    case 'deliver': {
      const r = evaluate(t); state.results = r; if (r.some(x => !x.ok)) { toast('Todavía hay criterios sin cumplir.'); return render(); }
      if (t.final) { mark(K.F(state.part)); toast(`Parte ${state.part + 1} aprobada.`); return go('final'); }
      mark(K.T(t.id)); const nx = P.tickets.find(x => !pr()[K.T(x.id)]);
      toast(nx ? `Ticket #${t.num} cerrado. Siguiente: ${nx.title}` : '¡Resolviste todos los escenarios! Se desbloqueó el proyecto final.');
      return nx ? go('ticket', { tid: nx.id }) : go('inicio', { tab: 'final' });
    }
    case 'wstab': state.wsTab = +d.i; return render();
    case 'add': ws().nodes.push({ k: d.k, c: '' }); save(); state.results = null; return render();
    case 'rm': ws().nodes.splice(+d.i, 1); save(); state.results = null; return render();
    case 'mv': { const n = ws().nodes, i = +d.i, j = i + +d.d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; save(); state.results = null; return render(); }
    case 'gadd': { const tb = (t.ws.tabs || [{ grid: t.ws.grid }])[state.wsTab] || {}; ws().grid.push(Object.fromEntries((tb.grid?.cols || []).map(c => [c.k, '']))); save(); return render(); }
    case 'grm': ws().grid.splice(+d.i, 1); save(); return render();
    case 'issue': return void issue();
    case 'copy': navigator.clipboard?.writeText(d.url).then(() => toast('Enlace copiado.')); return;
  }
});
document.addEventListener('input', e => {
  const el = e.target, d = el.dataset; if (!(state.view === 'ticket' || state.view === 'parte')) return;
  const s = ws();
  if (d.f !== undefined) s.v[d.f] = el.value;
  else if (d.g !== undefined) s.grid[+d.g][d.c] = el.value;
  else if (d.cfg !== undefined) s.nodes[+d.cfg].c = el.value;
  else if (el.hasAttribute('data-code')) { s.code = el.value; const ln = el.previousElementSibling; const n = Math.max(14, el.value.split('\n').length + 1); if (ln.childElementCount + 1 !== n) ln.innerHTML = Array.from({ length: n }, (_, i) => i + 1).join('<br>'); }
  else return;
  state.results = null; clearTimeout(syncT); syncT = setTimeout(persist, 400);
  const ver = $('.tk-ver .crit'); if (ver) ver.querySelectorAll('li').forEach(li => li.className = '');
});
document.addEventListener('change', e => { if (e.target.matches('select[data-f],select[data-c],select[data-cfg]')) persist(); });
// Tab dentro del editor de código inserta dos espacios
document.addEventListener('keydown', e => {
  if (e.key !== 'Tab' || !e.target.matches('textarea[data-code]')) return;
  e.preventDefault(); const t = e.target, a = t.selectionStart; t.setRangeText('  ', a, t.selectionEnd, 'end'); t.dispatchEvent(new Event('input', { bubbles: true }));
});
document.addEventListener('scroll', e => { if (e.target.matches?.('textarea[data-code]')) e.target.previousElementSibling.scrollTop = e.target.scrollTop; }, true);
window.addEventListener('hashchange', fromHash);

fromHash();
if (sb) {
  sb.auth.getSession().then(async ({ data: { session } }) => { if (session) { await loadCloud(session.user); await loadCert(); render(); } });
  sb.auth.onAuthStateChange((ev, session) => { if (ev === 'SIGNED_IN' && session && !cloud) loadCloud(session.user).then(loadCert).then(render); });
}
})();
