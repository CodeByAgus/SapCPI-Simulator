/* flowDev · página pública de verificación de certificados: certificado/?c=CODIGO */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PLAT = {
  btp: ['SAP BTP', 'btp', 'Integración y automatización', 'SAP'], abap: ['ABAP', 'abap', 'Desarrollo', 'SAP'], s4hana: ['SAP S/4HANA', 's4', 'Finanzas y operaciones', 'SAP'],
  knime: ['KNIME', 'knime', 'Datos', 'KNIME AG'], 'power-bi': ['Power BI', 'pbi', 'Datos', 'Microsoft'], successfactors: ['SAP SuccessFactors', 'sf', 'Personas y RRHH', 'SAP'],
  pa: ['Power Automate', 'pa', 'Integración y automatización', 'Microsoft'], sap: ['SAP CPI', 'sap', 'Integración y automatización', 'SAP'], cc: ['Claude Code', 'cc', 'Desarrollo', 'Anthropic'], api: ['Conexiones y APIs', 'api', 'Integración y automatización', 'ningún fabricante'],
};
const SBC = window.FLOWDEV_SUPABASE || {}, sb = SBC.url && SBC.anonKey && window.supabase ? window.supabase.createClient(SBC.url, SBC.anonKey) : null;
const view = $('#view');
let toastT;
const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); };
const fmt = d => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

const form = (msg = '', val = '') => `<section class="card verify">
  <p class="eyebrow">Verificar un certificado</p>
  <h1 class="h1">Ingresá el código del certificado</h1>
  <p class="lead dim">Cada certificado de flowDev tiene un código de 8 caracteres, por ejemplo <span class="mono">AB12-CD34</span>. Está en el certificado y en el enlace que compartió su titular.</p>
  <form id="vf" class="row" novalidate><label class="fld"><span>Código</span><input id="vc" value="${esc(val)}" maxlength="9" placeholder="XXXX-XXXX" autocomplete="off" autocapitalize="characters"></label><button class="btn" type="submit">Verificar</button></form>
  ${msg ? `<p class="bad-msg" role="alert">${msg}</p>` : ''}
</section>`;

async function load(code) {
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) { view.innerHTML = form(code ? 'El código tiene que tener el formato XXXX-XXXX.' : '', code); return; }
  if (!sb) { view.innerHTML = form('La verificación no está disponible en este momento.', code); return; }
  const { data: c, error } = await sb.rpc('verify_certificate', { p_code: code });
  if (error) { view.innerHTML = form('No pudimos consultar el certificado en este momento. Probá de nuevo en unos minutos.', code); return; }
  if (!c) { view.innerHTML = form(`No existe ningún certificado con el código <span class="mono">${esc(code)}</span>. Revisá que esté bien escrito.`, code); return; }
  render(c);
}

function render(c) {
  const [pname, mark, area, vendor] = PLAT[c.platform] || [c.platform, '', '', 'ningún fabricante'];
  const d = new Date(c.issued_at), url = `${location.origin}/certificado/?c=${c.code}`;
  const li = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(c.title + ' (simulador flowDev)')}&organizationName=flowDev&issueYear=${d.getFullYear()}&issueMonth=${d.getMonth() + 1}&certUrl=${encodeURIComponent(url)}&certId=${c.code}`;
  const parts = Array.isArray(c.summary) ? c.summary : [];
  const work = Array.isArray(c.solution?.parts) ? c.solution.parts : [];
  document.title = `Certificado ${c.code} · ${c.full_name} · flowDev`;
  view.innerHTML = `
  <section class="ok-bar no-print"><span class="okdot">✓</span><div><b>Certificado válido</b><span>Emitido por flowDev a ${esc(c.full_name)} el ${d.toLocaleDateString('es-AR')}.</span></div><span class="mono">${esc(c.code)}</span><a class="btn line sm" href="./">Verificar otro</a></section>
  <div class="cert-wrap">
    <article class="cert" aria-label="Certificado">
      <header class="cert-top"><span class="logo"><span class="logo-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></span><span class="logo-word">flow<b>Dev</b></span></span>
        <span class="cert-sim">${mark ? `<span class="mark sm" data-mark="${mark}"></span>` : ''}Simulación · ${esc(area)}</span></header>
      <p class="cert-kind">Certificado de cumplimiento</p>
      <p class="cert-se">Se certifica que</p>
      <h1 class="cert-name">${esc(c.full_name)}</h1>
      <p class="cert-what">completó y aprobó el <b>${esc(c.title)}</b> en flowDev, resuelto en ${parts.length} partes evaluadas automáticamente.</p>
      <ol class="cert-parts">${parts.map((p, i) => `<li><span>Parte ${i + 1}</span>${esc(p)}</li>`).join('')}</ol>
      <footer class="cert-foot">
        <div><span>Fecha de emisión</span><b>${fmt(d)}</b></div>
        <div><span>Plataforma</span><b>${esc(pname)} (simulador)</b></div>
        <div><span>Código</span><b class="mono">${esc(c.code)}</b></div>
        <div class="cert-seal" aria-hidden="true">✓<small>verificado</small></div>
      </footer>
      <p class="cert-url">Verificá este certificado en ${esc(location.host)}/certificado/?c=${esc(c.code)}</p>
      <p class="cert-legal">Acredita la realización del proyecto final en el simulador flowDev. No es una certificación oficial de ${esc(vendor)} ni de otro fabricante.</p>
    </article>
    <aside class="card side no-print">
      <h2 class="h2">Detalle</h2>
      <dl class="meta"><dt>Titular</dt><dd>${esc(c.full_name)}</dd><dt>Plataforma</dt><dd>${esc(pname)} (simulador)</dd><dt>Emitido</dt><dd>${d.toLocaleDateString('es-AR')}</dd><dt>Código</dt><dd class="mono">${esc(c.code)}</dd><dt>Estado</dt><dd><b>Válido</b></dd></dl>
      <a class="btn sky big" href="${li}" target="_blank" rel="noopener">Agregar a LinkedIn</a>
      <button type="button" class="btn big" data-act="print">Descargar PDF</button>
      <button type="button" class="btn line big" data-act="copy" data-url="${esc(url)}">Copiar enlace</button>
      <div class="tip"><b>Importante</b><p>Acredita el trabajo hecho en flowDev. No es una certificación oficial de ${esc(vendor)} ni de otro fabricante.</p></div>
    </aside>
  </div>
  ${work.length ? `<section class="card no-print work"><h2 class="h2">Trabajo entregado</h2><p class="dim">Lo que la persona resolvió en cada parte, tal como lo entregó en el simulador.</p>
    ${work.map((p, i) => `<details${i === 0 ? ' open' : ''}><summary><span class="rn">Parte ${i + 1}</span><b>${esc(p.title)}</b></summary><pre>${esc((p.work || []).join('\n'))}</pre></details>`).join('')}</section>` : ''}`;
}

document.addEventListener('submit', e => { if (e.target.id !== 'vf') return; e.preventDefault(); const c = $('#vc').value.trim().toUpperCase().replace(/^([A-Z0-9]{4})([A-Z0-9]{4})$/, '$1-$2'); history.replaceState(null, '', '?c=' + c); load(c); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'print') window.print();
  if (b.dataset.act === 'copy') navigator.clipboard?.writeText(b.dataset.url).then(() => toast('Enlace copiado.'));
});
load((new URLSearchParams(location.search).get('c') || '').trim().toUpperCase());
})();
