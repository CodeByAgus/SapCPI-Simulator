// =====================================================================
//  styles/flowdev/kit.js — la identidad de flowDev (flowdev-simulators.vercel.app) como estilo de animación.
//  Fondo de página oscuro, tarjetas redondeadas (blanco / celeste / tinta / gris), píldoras con borde,
//  tipografía sans apretada, la marca: un círculo celeste con una flecha. Movimiento en 1s con resortes (UI).
//  Colores con significado fijo: celeste = flowDev (el camino gratis); rojo = la licencia paga (el obstáculo).
//  Medido de la hoja de estilos del sitio (styles.css): --page #262624, --ink #111110, --sky #DCEEFB,
//  --grey #3D3D39, --muted-dark #A5A59D, radios 28px (tarjeta) y 18px (tarjeta chica), píldora 1.5px.
// =====================================================================
const FD = {
  page: '#262624', ink: '#111110', paper: '#FFFFFF', grey: '#3D3D39', line: '#E2E2DD', lineDark: '#34342F',
  sky: '#DCEEFB', sky2: '#A9C6DC', sky3: '#7FA4C0', muted: '#6C6C66', mutedDark: '#A5A59D', red: '#C4453B', redSoft: '#F8DEDB',
  font: '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  mono: '"Cascadia Mono", Consolas, "SF Mono", Menlo, monospace',
};

// ---- formas: tarjeta, píldora, texto
function fdRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fdCard(x, y, w, h, fill, o = {}) {
  ctx.save();
  if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14; }
  fdRect(x, y, w, h, o.r ?? 28); ctx.fillStyle = fill; ctx.fill();
  ctx.restore();
  if (o.stroke) { ctx.save(); fdRect(x, y, w, h, o.r ?? 28); ctx.lineWidth = o.sw ?? 3; ctx.strokeStyle = o.stroke; ctx.stroke(); ctx.restore(); }
}
// texto con escritura progresiva (o.frac 0..1) y tracking negativo como el display del sitio
function fdText(str, x, y, size, color, o = {}) {
  ctx.save();
  ctx.font = `${o.weight ?? 600} ${size}px ${o.mono ? FD.mono : FD.font}`;
  ctx.letterSpacing = `${o.ls ?? (size >= 60 ? -size * 0.035 : 0)}px`;
  ctx.fillStyle = color; ctx.textAlign = o.align ?? 'left'; ctx.textBaseline = o.base ?? 'alphabetic';
  const w = ctx.measureText(str).width, frac = clamp(o.frac ?? 1);
  if (frac < 1) {
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    ctx.beginPath(); ctx.rect(x0 - 6, y - size * 1.2, (w + 12) * frac, size * 1.7); ctx.clip();
  }
  if (frac > 0) ctx.fillText(str, x, y);
  ctx.restore(); return w;
}
const fdW = (str, size, weight = 600) => { ctx.save(); ctx.font = `${weight} ${size}px ${FD.font}`; ctx.letterSpacing = `${size >= 60 ? -size * 0.035 : 0}px`; const w = ctx.measureText(str).width; ctx.restore(); return w; };
// píldora: borde 1.5px (escalado), texto centrado. o.fill rellena (como .pill.fill del sitio)
function fdPill(str, x, y, size, color, o = {}) {
  const w = fdW(str, size, o.weight ?? 500) + size * 1.4, h = size * 1.75, x0 = o.align === 'center' ? x - w / 2 : x;
  ctx.save();
  fdRect(x0, y - h / 2, w, h, h / 2);
  if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
  if (o.border !== false) { ctx.lineWidth = Math.max(2, size * 0.075); ctx.strokeStyle = o.borderColor ?? color; ctx.stroke(); }
  ctx.restore();
  fdText(str, x0 + w / 2, y + size * 0.36, size, color, { align: 'center', weight: o.weight ?? 500, ls: 0 });
  return w;
}

// ---- la marca: círculo celeste + flecha de tinta (el logo del sitio). Es el héroe.
// o.mood: 'idle' | 'push' (se inclina hacia adelante) | 'hurt' (rebota) | 'happy' (salta)
function fdArrowGlyph(x, y, r, color, w) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - r * 0.46, y); ctx.lineTo(x + r * 0.42, y);
  ctx.moveTo(x + r * 0.02, y - r * 0.4); ctx.lineTo(x + r * 0.44, y); ctx.lineTo(x + r * 0.02, y + r * 0.4); ctx.stroke();
  ctx.restore();
}
function fdHero(x, y, r, o = {}) {
  const key = o.key ?? 'hero';
  // vida en reposo: un leve respiro (escala) y un parpadeo de la flecha que "mira" hacia adelante
  const breathe = 1 + Math.sin(TT * TAU * 0.8 + key.length) * 0.025;
  const R = r * breathe * (o.s ?? 1);
  SPARK_AT = toScreen(x, y);
  ctx.save();
  if (o.ring) { ctx.beginPath(); ctx.arc(x, y, R * 1.35, 0, TAU); ctx.strokeStyle = FD.sky; ctx.globalAlpha = 0.35 * o.ring; ctx.lineWidth = R * 0.08; ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = R * 0.4; ctx.shadowOffsetY = R * 0.12;
  ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fillStyle = FD.sky; ctx.fill();
  ctx.restore();
  const nudge = Math.sin(TT * TAU * 1.0) * R * 0.04;
  fdArrowGlyph(x + nudge, y, R, FD.ink, Math.max(3, R * 0.13));
}

// ---- el candado (la licencia): cuerpo redondeado + arco. u = 0 cerrado
function fdLockPts(x, y, s) {   // contorno del candado (para el morph): cuerpo + arco como una sola silueta
  const P = [];
  const bw = s * 1.0, bh = s * 0.8, top = y - bh * 0.1;
  // arco (de izquierda a derecha por arriba)
  for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; P.push([x + Math.cos(a) * s * 0.34, top + Math.sin(a) * s * 0.42]); }
  P.push([x + bw / 2, top]); P.push([x + bw / 2, top + bh]); P.push([x - bw / 2, top + bh]); P.push([x - bw / 2, top]);
  return P;
}
function fdLock(x, y, s, o = {}) {
  const top = y - s * 0.08, shackle = o.open ?? 0;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = o.color ?? FD.red; ctx.lineWidth = s * 0.12;
  ctx.beginPath(); ctx.arc(x, top - shackle * s * 0.25, s * 0.3, Math.PI, 0); ctx.lineTo(x + s * 0.3, top + s * 0.05 - shackle * s * 0.25); ctx.moveTo(x - s * 0.3, top - shackle * s * 0.25); ctx.lineTo(x - s * 0.3, top + s * 0.05); ctx.stroke();
  fdRect(x - s * 0.5, top, s, s * 0.78, s * 0.14); ctx.fillStyle = o.color ?? FD.red; ctx.fill();
  ctx.beginPath(); ctx.arc(x, top + s * 0.34, s * 0.09, 0, TAU); ctx.fillStyle = o.hole ?? FD.paper; ctx.fill();
  ctx.fillRect(x - s * 0.03, top + s * 0.36, s * 0.06, s * 0.2);
  ctx.restore();
}

// ---- captura real del sitio dentro de una tarjeta (como un recuadro del propio sitio)
function fdShot(name, x, y, w, h, o = {}) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  fdRect(x, y, w, h, o.r ?? 22); ctx.fillStyle = FD.ink; ctx.fill(); ctx.restore();
  if (o.src) {   // recorte de la captura: [sx, sy, sw, sh] en píxeles de la imagen
    const img = asset(name); if (!img) return;
    ctx.save(); fdRect(x, y, w, h, o.r ?? 22); ctx.clip(); ctx.drawImage(img, ...o.src, x, y, w, h); ctx.restore();
  } else drawAsset(name, x, y, w, h, { fit: 'cover', r: o.r ?? 22 });
  if (o.ring) { ctx.save(); fdRect(x, y, w, h, o.r ?? 22); ctx.lineWidth = 3; ctx.strokeStyle = FD.lineDark; ctx.stroke(); ctx.restore(); }
}
// un resaltado celeste sobre un área de la captura (el puntero de flowDev la marca)
function fdHighlight(x, y, w, h, u) {
  if (u <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(u); fdRect(x - 8, y - 8, w + 16, h + 16, 18);
  ctx.lineWidth = 6; ctx.strokeStyle = FD.sky3; ctx.stroke(); ctx.restore();
}

// ---- textos de pantalla: se dibujan después de la cámara, a tamaño de pantalla (DEFER)
const fdDefer = (f) => { if (DEFER) DEFER.push(f); else f(); };

// =====================================================================
//  STYLE — los ganchos del renderizador
// =====================================================================
const STYLE = {
  name: 'flowdev',
  paper: FD.page,                                       // el morph ocurre sobre la página oscura
  backdrop(c) { fillAll(c); },
  window(P, key, src, o) {                              // el mundo visto a través del contorno: un recorte limpio con borde celeste fino
    ctx.save(); trace(P, true); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
    ctx.save(); trace(P, true); ctx.lineWidth = 4; ctx.strokeStyle = o && o.phase === 'grow' ? FD.sky : FD.red; ctx.globalAlpha = 0.9; ctx.stroke(); ctx.restore();
  },
  blob(P, c) { ctx.save(); trace(P, true); ctx.fillStyle = c; ctx.fill(); ctx.restore(); },
  hero(x, y, r, o) { fdHero(x, y, r * 0.6, o); },
  heroColor: FD.sky,
  heroPts(x, y, r) { return ellipsePts(x, y, r * 0.6, r * 0.6, 0, 96); },
  post() {},
  ones: true,                                           // UI: movimiento en 1s, con resortes
};
