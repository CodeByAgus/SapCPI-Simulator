/* flowDev · ayudas para escribir los criterios de verificación de los tickets (se carga antes de datos.js).
   Cada función devuelve un criterio: (s) => true/false, donde s es el área de trabajo
   { v: campos del formulario, grid: filas de la tabla, code: texto del editor, nodes: [{k, c}] de la cadena }. */
(() => {
  const n = x => String(x ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
  // Acepta 1.597.200 · 1597200 · 1597200,00 · 1597200.00 · $ 1.597.200
  const num = x => {
    const t = String(x ?? '').replace(/[\s$]/g, '');
    if (t.includes(',')) return Number(t.replace(/\./g, '').replace(',', '.'));
    if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ''));
    return t === '' ? NaN : Number(t);
  };
  // ABAP y DAX: se ignoran comentarios y mayúsculas para revisar la estructura
  const clean = c => String(c || '').split('\n').filter(l => !/^\s*\*/.test(l)).map(l => l.replace(/".*$/, '').replace(/\/\/.*$/, '')).join('\n');
  const FD = {
    n, num, clean,
    // Formularios
    eq: (k, v) => s => n(s.v[k]) === n(v),
    oneOf: (k, vs) => s => vs.map(n).includes(n(s.v[k])),
    match: (k, re) => s => re.test(String(s.v[k] ?? '').trim()),
    filled: (...ks) => s => ks.every(k => String(s.v[k] ?? '').trim() !== ''),
    numEq: (k, v, tol = 0.01) => s => Math.abs(num(s.v[k]) - v) <= tol,
    // Tabla de posiciones: alguna fila cumple todas las condiciones {col: valor | RegExp | número}
    row: cond => s => (s.grid || []).some(r => Object.entries(cond).every(([c, v]) => v instanceof RegExp ? v.test(String(r[c] ?? '').trim()) : typeof v === 'number' ? Math.abs(num(r[c]) - v) <= 0.01 : n(r[c]) === n(v))),
    rows: k => s => (s.grid || []).filter(r => Object.values(r).some(x => String(x).trim())).length === k,
    // Editor de código
    code: re => s => re.test(clean(s.code)),
    noCode: re => s => !re.test(clean(s.code)),
    // Cadena de nodos
    has: k => s => s.nodes.some(x => x.k === k),
    seq: ks => s => { let i = 0; for (const x of s.nodes) if (x.k === ks[i]) i++; return i === ks.length; },
    first: k => s => s.nodes[0]?.k === k,
    last: k => s => s.nodes[s.nodes.length - 1]?.k === k,
    // En la configuración, | o ; valen como separador igual que ·
    cfg: (k, re) => s => s.nodes.some(x => x.k === k && re.test(String(x.c ?? '').trim().replace(/\s*[|;]\s*/g, ' · ').replace(/\s*·\s*/g, ' · '))),
    count: (k, c) => s => s.nodes.filter(x => x.k === k).length === c,
    all: (...fs) => s => fs.every(f => f(s)),
    any: (...fs) => s => fs.some(f => f(s)),
  };
  // Foto de Unsplash con el tamaño justo
  FD.photo = (id, alt, w = 1400) => ({ src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`, alt, by: '' });
  window.FD = FD;
})();
