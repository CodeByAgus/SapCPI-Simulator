/* flowDev · panel de administración. Lee estadísticas anónimas con la función admin_stats() de Supabase
   (supabase/admin.sql), que solo responde a las cuentas de la tabla admins. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const view = $('#view'), tip = $('#tip'), btnRefresh = $('#btnRefresh');
const SBC = window.FLOWDEV_SUPABASE || {};
const sb = SBC.url && SBC.anonKey && window.supabase ? window.supabase.createClient(SBC.url, SBC.anonKey) : null;

// Contenido de cada plataforma (igual que el catálogo de app.js)
const PLAT = [
  { k: 'pa', name: 'Power Automate', parts: [['l', 'Teoría', 20], ['p', 'Escenarios', 20], ['q', 'Cuestionarios', 20]] },
  { k: 'sap', name: 'SAP CPI', parts: [['l', 'Teoría', 20], ['p', 'Escenarios', 20], ['q', 'Cuestionarios', 20]] },
];
const platTotal = p => p.parts.reduce((a, x) => a + x[2], 0);
const TOTAL = PLAT.reduce((a, p) => a + platTotal(p), 0);
const DAY = 864e5;

/* ---------------- Utilidades de DOM (los textos van siempre con textContent) ---------------- */
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v; else if (k === 'style') el.style.cssText = v; else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}
const nf = new Intl.NumberFormat('es-AR'), nf1 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
const pct = v => `${nf1.format(Math.round(v * 10) / 10)}%`;
const fdate = d => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fday = d => new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

/* ---------------- Tooltip compartido (mouse y teclado) ---------------- */
function bindTip(el, title, value) {
  const show = e => {
    tip.replaceChildren(h('b', {}, value), title); tip.hidden = false;
    const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    const x = e?.clientX ?? r.left + r.width / 2, y = e?.clientY ?? r.top;
    tip.style.left = Math.min(innerWidth - tw - 8, Math.max(8, x - tw / 2)) + 'px';
    tip.style.top = Math.max(8, y - th - 12) + 'px';
  };
  const hide = () => { tip.hidden = true; };
  el.addEventListener('pointermove', show); el.addEventListener('pointerleave', hide);
  el.addEventListener('focus', () => show()); el.addEventListener('blur', hide);
  el.tabIndex = 0; el.setAttribute('aria-label', `${title}: ${value}`);
}

/* ---------------- Gráficos ---------------- */
// Barras verticales de una sola serie: [{ label, value, tip }]
function vbars(data, axis) {
  const max = Math.max(1, ...data.map(d => d.value));
  const box = h('div', { class: 'vbars' + (axis.each ? ' wide' : ''), role: 'img', 'aria-label': axis.aria }, h('span', { class: 'max' }, nf.format(max)));
  data.forEach(d => {
    const col = h('div', { class: 'col' }, h('div', { class: 'bar' + (d.value ? '' : ' zero'), style: `height:${d.value / max * 100}%` }));
    bindTip(col, d.tip || d.label, nf.format(d.value));
    box.append(col);
  });
  // axis.each: una etiqueta debajo de cada barra; si no, unas pocas marcas repartidas
  const ticks = axis.each ? data.map(d => d.label) : axis.ticks;
  return h('div', {}, box, h('div', { class: 'vaxis' + (axis.each ? ' each' : '') }, ...ticks.map(t => h('span', {}, t))));
}
// Barras horizontales con valor al final: [{ group?, label, value (0-100 o cantidad), text, tip, max }]
function hbars(rows) {
  const g = h('div', { class: 'hbars' });
  let last = null;
  rows.forEach(r => {
    if (r.group && r.group !== last) { g.append(h('p', { class: 'hgroup' }, r.group)); last = r.group; }
    const track = h('div', { class: 'ht' }, h('div', { class: 'hb', style: `width:${r.max ? Math.min(100, r.value / r.max * 100) : 0}%` }));
    bindTip(track, r.tip || r.label, r.text);
    g.append(h('span', { class: 'hl' }, r.label), track, h('span', { class: 'hv' }, r.text));
  });
  return g;
}
const card = (title, sub, ...body) => h('section', { class: 'card ad-card' }, h('h2', {}, title), sub ? h('p', { class: 'sub' }, sub) : null, ...body);
const kpi = (v, l, s, dark) => h('div', { class: 'ad-kpi' + (dark ? ' dk' : '') }, h('span', { class: 'v' }, v), h('span', { class: 'l' }, l), s ? h('span', { class: 's' }, s) : null);

/* ---------------- Cálculos ---------------- */
function compute(users) {
  const now = Date.now();
  const lastActive = u => Math.max(u.last_sign_in ? Date.parse(u.last_sign_in) : 0, u.last_progress ? Date.parse(u.last_progress) : 0);
  const activeIn = days => users.filter(u => now - lastActive(u) <= days * DAY).length;
  const done = (u, p) => p.parts.reduce((a, [x]) => a + (u[`${p.k}_${x}`] || 0), 0);
  const per = users.map(u => {
    const byPlat = PLAT.map(p => done(u, p)), all = byPlat.reduce((a, b) => a + b, 0);
    return { u, byPlat, all, started: byPlat.filter(n => n > 0).length, finished: PLAT.filter((p, i) => byPlat[i] >= platTotal(p)).length, solved: PLAT.reduce((a, p) => a + (u[`${p.k}_p`] || 0), 0) };
  });
  const withProgress = per.filter(x => x.all > 0);
  return {
    total: users.length,
    confirmed: users.filter(u => u.confirmed).length,
    new7: users.filter(u => now - Date.parse(u.created) <= 7 * DAY).length,
    new30: users.filter(u => now - Date.parse(u.created) <= 30 * DAY).length,
    a1: activeIn(1), a7: activeIn(7), a30: activeIn(30),
    avgStarted: avg(per.map(x => x.started)),
    avgPct: avg(per.map(x => x.all / TOTAL * 100)),
    avgPctActive: avg(withProgress.map(x => x.all / TOTAL * 100)),
    avgItems: avg(per.map(x => x.all)),
    withProgress: withProgress.length,
    solvedOne: per.filter(x => x.solved > 0).length,
    finishedOne: per.filter(x => x.finished > 0).length,
    providers: users.reduce((m, u) => (m[u.provider] = (m[u.provider] || 0) + 1, m), {}),
    per, lastActive,
  };
}

/* ---------------- Vista ---------------- */
function message(title, text, action) {
  btnRefresh.hidden = true;
  view.replaceChildren(h('section', { class: 'card ad-card', style: 'max-width:640px' }, h('h1', { class: 'h2' }, title), h('p', {}, text), action || null));
}

function render(stats) {
  const users = stats.users || [], c = compute(users), now = Date.now();
  const share = n => c.total ? pct(n / c.total * 100) : '0%';

  // Registros por día, últimos 30 días
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(now - (29 - i) * DAY); d.setHours(0, 0, 0, 0); return d; });
  const perDay = days.map(d => ({ label: fday(d), tip: fday(d), value: users.filter(u => { const t = new Date(u.created); t.setHours(0, 0, 0, 0); return t.getTime() === d.getTime(); }).length }));

  // Distribución del avance total por usuario
  const buckets = [['0%', x => x === 0], ['1–25%', x => x > 0 && x <= 25], ['26–50%', x => x > 25 && x <= 50], ['51–75%', x => x > 50 && x <= 75], ['76–99%', x => x > 75 && x < 100], ['100%', x => x >= 100]];
  const dist = buckets.map(([label, f]) => ({ label, value: c.per.filter(x => f(x.all / TOTAL * 100)).length }));

  // Avance promedio por plataforma y sección, entre quienes empezaron esa plataforma
  const platRows = PLAT.flatMap((p, i) => {
    const who = c.per.filter(x => x.byPlat[i] > 0);
    return p.parts.map(([k, label, n]) => {
      const v = avg(who.map(x => (x.u[`${p.k}_${k}`] || 0) / n * 100));
      return { group: `${p.name} · ${who.length} ${who.length === 1 ? 'usuario' : 'usuarios'}`, label, value: v, max: 100, text: pct(v), tip: `${p.name} · ${label} (promedio)` };
    });
  });

  // Embudo
  const funnel = [['Registrados', c.total], ['Con algún avance', c.withProgress], ['Resolvieron un escenario', c.solvedOne], ['Completaron una plataforma', c.finishedOne]]
    .map(([label, n]) => ({ label, value: n, max: Math.max(1, c.total), text: nf.format(n), tip: `${label} · ${share(n)}` }));

  // Proveedores de ingreso
  const provName = { google: 'Google', email: 'Email y contraseña' };
  const prov = Object.entries(c.providers).sort((a, b) => b[1] - a[1])
    .map(([k, n]) => ({ label: provName[k] || k, value: n, max: Math.max(1, c.total), text: `${nf.format(n)} · ${share(n)}` }));

  // Contenido más completado
  const keyName = k => {
    const [plat, a, b] = k.split(':'), p = PLAT.find(x => x.k === plat)?.name || plat;
    if (/^L\d+$/.test(a)) return `${p} · Clase ${Number(a.slice(1)) + 1}`;
    if (a === 'Q') return `${p} · Cuestionario ${b.replace(/^c/, '')}`;
    if (a === 'P') return `${p} · Escenario ${b}`;
    return k;
  };
  const topMax = Math.max(1, ...(stats.top || []).map(t => t.n));
  const top = (stats.top || []).map(t => ({ label: keyName(t.key), value: t.n, max: topMax, text: nf.format(t.n), tip: keyName(t.key) }));

  // Tabla anónima de usuarios, de la actividad más reciente a la más vieja
  const rows = [...c.per].sort((a, b) => c.lastActive(b.u) - c.lastActive(a.u)).slice(0, 100);
  const table = h('div', { class: 'ad-scroll' }, h('table', { class: 'ad-table' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Registro'), h('th', {}, 'Última actividad'), h('th', {}, 'Ingreso'),
      ...PLAT.map(p => h('th', { class: 'n' }, p.name)), h('th', { class: 'n' }, 'Total'))),
    h('tbody', {}, rows.map(x => h('tr', {}, h('td', {}, fdate(x.u.created)), h('td', {}, c.lastActive(x.u) ? fdate(c.lastActive(x.u)) : '—'),
      h('td', {}, provName[x.u.provider] || x.u.provider), ...PLAT.map((p, i) => h('td', { class: 'n' }, pct(x.byPlat[i] / platTotal(p) * 100))),
      h('td', { class: 'n' }, pct(x.all / TOTAL * 100)))))));

  view.replaceChildren(
    h('section', { class: 'card ad-card' },
      h('div', { class: 'ad-head' },
        h('div', {}, h('p', { class: 'eyebrow dim' }, 'Panel de administración'), h('h1', { class: 'display' }, 'Estadísticas')),
        h('p', { class: 'dim' }, `Actualizado: ${new Date(stats.generated_at || now).toLocaleString('es-AR')}`)),
      h('div', { class: 'ad-kpis' },
        kpi(nf.format(c.total), 'Registros totales', `${nf.format(c.new7)} en los últimos 7 días · ${nf.format(c.new30)} en 30`),
        kpi(nf.format(c.a7), 'Usuarios activos (7 días)', `${nf.format(c.a1)} en 24 h · ${nf.format(c.a30)} en 30 días`, true),
        kpi(nf1.format(c.avgStarted), 'Cursos iniciados por usuario', `de ${PLAT.length} plataformas · ${share(c.withProgress)} empezó al menos una`, true),
        kpi(pct(c.avgPct), 'Completado promedio', `${pct(c.avgPctActive)} entre quienes empezaron · ${nf1.format(c.avgItems)} de ${TOTAL} ítems`),
        kpi(nf.format(c.solvedOne), 'Resolvieron un escenario', share(c.solvedOne) + ' de los registrados'),
        kpi(nf.format(c.finishedOne), 'Completaron una plataforma', share(c.finishedOne) + ' de los registrados', true),
        kpi(nf.format(c.total - c.withProgress), 'Sin avance todavía', share(c.total - c.withProgress) + ' de los registrados', true),
        kpi(nf.format(c.confirmed), 'Emails confirmados', share(c.confirmed) + ' de los registrados'),
      ),
    ),
    h('div', { class: 'ad-grid' },
      card('Registros por día', 'Últimos 30 días', vbars(perDay, { aria: 'Registros por día en los últimos 30 días', ticks: [fday(days[0]), fday(days[15]), 'Hoy'] })),
      card('Avance de cada usuario', `Porcentaje completado de los ${TOTAL} ítems (clases, escenarios y cuestionarios)`, vbars(dist, { aria: 'Cantidad de usuarios por rango de avance', each: true })),
      card('Avance promedio por sección', 'Entre los usuarios que empezaron cada plataforma', hbars(platRows)),
      card('Embudo', 'Cuántos usuarios llegan a cada etapa', hbars(funnel)),
      card('Contenido más completado', 'Clases leídas, escenarios resueltos y cuestionarios aprobados', top.length ? hbars(top) : h('p', { class: 'dim' }, 'Todavía no hay avance guardado.')),
      card('Forma de ingreso', null, hbars(prov)),
    ),
    card('Usuarios', `Datos anónimos: no se muestran emails ni nombres. ${rows.length < c.total ? `Se ven los ${rows.length} con actividad más reciente.` : ''}`, table),
    h('p', { class: 'ad-note' }, 'Activo = ingresó o guardó avance en el período. Solo se cuentan usuarios con cuenta: las visitas sin cuenta no se registran.'),
  );
  btnRefresh.hidden = false;
}

/* ---------------- Carga ---------------- */
async function load() {
  if (!sb) return message('Falta configurar Supabase', 'El panel necesita la URL y la anon key en config.js.');
  btnRefresh.disabled = true;
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return message('Ingresá para ver el panel', 'Iniciá sesión con tu cuenta de administrador de flowDev y volvé a esta página.', h('div', {}, h('a', { class: 'btn', href: '../index.html#ingreso' }, 'Ingresar')));
    const { data, error } = await sb.rpc('admin_stats');
    if (error) {
      if (error.code === '42501' || /forbidden/i.test(error.message)) return message('Sin acceso', 'Tu cuenta no está en la lista de administradores del panel.');
      if (error.code === 'PGRST202' || /admin_stats/.test(error.message)) return message('Falta configurar el panel', 'Ejecutá supabase/admin.sql en el SQL Editor de Supabase y agregá tu cuenta a la tabla admins.');
      return message('No se pudieron cargar las estadísticas', error.message);
    }
    render(data || {});
  } finally { btnRefresh.disabled = false; }
}
btnRefresh.addEventListener('click', load);
load();
})();
