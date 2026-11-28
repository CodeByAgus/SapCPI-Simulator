/* flowDev · catálogo de cursos gratis: filtros por nicho y búsqueda */
(() => {
const C = window.FD_CURSOS, $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ini = p => p.split(/\s+/).filter(w => /^[A-ZÁÉÍÓÚ]/.test(w)).slice(0, 2).map(w => w[0]).join('') || p.slice(0, 2).toUpperCase();
const nombre = Object.fromEntries(C.nichos);
let nicho = new URLSearchParams(location.search).get('nicho') || 'todos', q = '';
$('#rev').textContent = ` · última revisión: ${C.rev}`;
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function render() {
  const all = [['todos', 'Todos', C.cursos.length], ...C.nichos.map(([k, l]) => [k, l, C.cursos.filter(c => c.n === k).length])];
  $('#chips').innerHTML = all.map(([k, l, n]) => `<button type="button" role="tab" data-n="${k}" aria-selected="${k === nicho}">${esc(l)} <span class="dim">${n}</span></button>`).join('');
  const list = C.cursos.filter(c => (nicho === 'todos' || c.n === nicho) && (!q || norm([c.t, c.p, c.d, c.para, nombre[c.n]].join(' ')).includes(norm(q))));
  $('#count').textContent = `${list.length} ${list.length === 1 ? 'curso' : 'cursos'}${nicho !== 'todos' ? ' en ' + nombre[nicho] : ''}${q ? ` que coinciden con “${q}”` : ''}`;
  $('#grid').innerHTML = list.length ? list.map(c => `<article class="c-card">
    <div class="row sb"><span class="pill">${esc(nombre[c.n])}</span><span class="mono dim">${esc(c.h)}</span></div>
    <h2 class="h3">${esc(c.t)}</h2>
    <p class="dim">${esc(c.d)}</p>
    <div class="c-prov"><span class="av">${esc(ini(c.p))}</span><span>${esc(c.p)}<br><small class="dim">${esc(c.idioma)}</small></span></div>
    <p class="c-para">${esc(c.para)}</p>
    <div class="c-foot"><span class="pill sky">Curso gratis · ${esc(c.cred)}</span><span class="dim small">Revisado en ${esc(C.rev)}</span></div>
    <a class="btn line sm" href="${esc(c.url)}" target="_blank" rel="noopener">Ir al curso<span class="sr-only"> ${esc(c.t)} (se abre en otra pestaña)</span></a>
  </article>`).join('') : '<p class="dim">No hay cursos con esa búsqueda. Probá con otra palabra o elegí “Todos”.</p>';
}
document.addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; nicho = b.dataset.n; history.replaceState(null, '', nicho === 'todos' ? location.pathname : '?nicho=' + nicho); render(); });
$('#q').addEventListener('input', e => { q = e.target.value.trim(); render(); });
render();
})();
