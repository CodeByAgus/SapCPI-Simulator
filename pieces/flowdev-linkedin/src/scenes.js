
// =====================================================================
//  ESCENAS — 1920x1080. Cada plano está completo en su primer cuadro (corte en la grilla);
//  solo se animan los efectos del paso: el puntero de flowDev, el resaltado, un push-in leve.
// =====================================================================
const since = () => TT - E0;
const MARGIN = 120;

// ---- 1 y 9: el texto del deseo (inicio) y su respuesta (final), mismo encuadre
function fdHeadline(lines, o = {}) {
  lines.forEach(([str, color, size, y], i) => fdText(str, MARGIN, y, size, color, { weight: 600, frac: o.fracs ? o.fracs[i] : 1 }));
}
function sceneWish() {
  fillAll(FD.page);
  fdText('QUERÉS APRENDER', MARGIN, 330, 30, FD.mutedDark, { weight: 600, ls: 4 });
  fdHeadline([['Las herramientas que', FD.paper, 104, 450], ['usan las empresas', FD.paper, 104, 570]], { fracs: [ev(0.05, 0.45), ev(0.35, 0.45)] });
  // las dos plataformas, como píldoras del sitio
  const k1 = popS(TIMELINE.cues.pills), k2 = popS(TIMELINE.cues.pills + 0.15);
  ctx.save(); ctx.translate(MARGIN, 690); ctx.scale(k1, k1); fdPill('SAP CPI', 0, 0, 44, FD.ink, { fill: FD.sky, border: false }); ctx.restore();
  ctx.save(); ctx.translate(MARGIN + 270, 690); ctx.scale(k2, k2); fdPill('Power Automate', 0, 0, 44, FD.paper); ctx.restore();
  // la flecha de flowDev espera y, en «set», se prepara para salir (se corre hacia adelante)
  const x = springMove(TIMELINE.cues.set, 1500, 1580, SPRING.playful);
  fdHero(x, 560, 120, { key: 'hero' });
}

// ---- 2: la licencia frena a la flecha
function sceneLicense() {
  fillAll(FD.page);
  const cu = TIMELINE.cues;
  // la tarjeta de precio (como una tarjeta blanca del sitio) con el candado rojo
  const shake = TT > cu.bump && TT < cu.bump + 0.35 ? Math.sin((TT - cu.bump) * 60) * 10 * (1 - (TT - cu.bump) / 0.35) : 0;
  ctx.save(); ctx.translate(shake, 0);
  fdCard(1000, 190, 740, 700, FD.paper, { shadow: true });
  fdText('LICENCIA EMPRESARIAL', 1370, 290, 30, FD.muted, { weight: 600, align: 'center', ls: 4 });
  const kl = popS(cu.lock);
  ctx.save(); ctx.translate(1370, 500); ctx.scale(kl, kl); fdLock(0, 0, 210); ctx.restore();
  const kt = popS(cu.tag);
  ctx.save(); ctx.translate(1370, 790); ctx.scale(kt, kt); fdPill('$ por usuario / mes', 0, 0, 44, FD.red, { align: 'center', fill: FD.redSoft, border: false, weight: 600 }); ctx.restore();
  ctx.restore();
  // el texto: «Pero se pagan por licencia.»
  fdText('Pero se pagan', MARGIN, 300, 96, FD.paper, { frac: ev(cu.cap2, 0.4) });
  fdText('por licencia.', MARGIN, 410, 96, FD.red, { frac: ev(cu.cap2 + 0.25, 0.4) });
  // la flecha va hacia la tarjeta, choca en «bump» y rebota
  const x = springTrack([[2.0, 330], [cu.bump - 0.35, 905], [cu.bump, 560]], SPRING.snappy);
  const squash = TT > cu.bump && TT < cu.bump + 0.25 ? 1 - 0.12 * Math.sin((TT - cu.bump) / 0.25 * Math.PI) : 1;
  ctx.save(); ctx.translate(x, 640); ctx.scale(squash, 1 / squash); fdHero(0, 0, 90, { key: 'hero' }); ctx.restore();
}

// ---- 3: «Con flowDev, no.» — la flecha nace del candado
function sceneTurn() {
  fillAll(FD.page);
  fdHero(960, 420, 170, { key: 'hero', ring: ev(5.6, 0.4) });
  const w1 = fdW('Con ', 104), w2 = fdW('flowDev', 104), w3 = fdW(', no.', 104), x0 = 960 - (w1 + w2 + w3) / 2, f = ev(TIMELINE.cues.turnCap, 0.4);
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 10, 600, (w1 + w2 + w3 + 20) * f, 200); ctx.clip();
  fdText('Con ', x0, 740, 104, FD.paper); fdText('flowDev', x0 + w1, 740, 104, FD.sky); fdText(', no.', x0 + w1 + w2, 740, 104, FD.paper);
  ctx.restore();
}

// ---- 4 y 5: el escenario fijo de los pasos — texto a la izquierda, captura real a la derecha
const SHOT_BOX = { x: 700, y: 110, w: 1110, h: 860 };   // proporción 1.29
const STEPS = {
  home:   { n: 'flowDev', t1: 'Simuladores', t2: 'en tu navegador', sub: 'SAP CPI y Power Automate, sin licencia.', img: 'home.png', src: [330, 90, 1260, 977], hl: [966, 823, 144, 46] },
  theory: { n: '01', t1: 'Aprendé', t2: 'la teoría', sub: 'Clases cortas, sin relleno.', img: 'teoria.png', src: [40, 0, 1394, 1080], hl: [67, 276, 560, 42] },
  flow:   { n: '02', t1: 'Armá', t2: 'el flujo', sub: 'Arrastrá elementos y conectalos.', img: 'iflow.png', src: [292, 175, 900, 698], hl: [600, 285, 545, 75] },
  run:    { n: '03', t1: 'Probalo', t2: 'paso a paso', sub: 'Mirá qué entra y sale de cada paso.', img: 'probar.png', src: [600, 80, 1294, 1000], hl: [1346, 442, 524, 228] },
  verify: { n: '04', t1: 'Verificá', t2: 'tu solución', sub: 'Pruebas automáticas, como en un proyecto.', img: 'verificar.png', src: [600, 80, 1294, 1000], hl: [1344, 178, 360, 36] },
};
function sceneStep(key) {
  fillAll(FD.page);
  const s = STEPS[key], B0 = SHOT_BOX, t = since();
  // un push-in leve hacia el área resaltada (vida dentro del plano)
  const z = 1 + 0.07 * springEase(t - 0.2, 60, 16);
  const [sx, sy, sw, sh] = s.src, cx = s.hl[0] + s.hl[2] / 2, cy = s.hl[1] + s.hl[3] / 2;
  const nw = sw / z, nh = sh / z, nx = clamp(sx + (cx - sx) * (1 - 1 / z), sx, sx + sw - nw), ny = clamp(sy + (cy - sy) * (1 - 1 / z), sy, sy + sh - nh);
  fdShot(s.img, B0.x, B0.y, B0.w, B0.h, { src: [nx, ny, nw, nh], r: 26 });
  // el resaltado y el puntero de flowDev (coordenadas de la imagen → pantalla)
  const map = (ix, iy) => [B0.x + (ix - nx) * B0.w / nw, B0.y + (iy - ny) * B0.h / nh];
  const [hx, hy] = map(s.hl[0], s.hl[1]), [hx2, hy2] = map(s.hl[0] + s.hl[2], s.hl[1] + s.hl[3]);
  fdHighlight(hx, hy, hx2 - hx, hy2 - hy, ev(E0 + 0.45, 0.3));
  // el puntero se ubica a la izquierda del área resaltada, a su altura (si está pegada al borde, sobre el borde de la tarjeta)
  const px = springMove(E0 + 0.15, 560, Math.max(hx - 66, B0.x - 34), SPRING.smooth), py = springMove(E0 + 0.15, 820, clamp((hy + hy2) / 2, B0.y + 60, B0.y + B0.h - 60), SPRING.smooth);
  fdHero(px, py, 52, { key: 'hero' });
  // el texto del paso: completo desde el primer cuadro (define el plano)
  fdPill(s.n, MARGIN, 330, 34, s.n === 'flowDev' ? FD.ink : FD.paper, s.n === 'flowDev' ? { fill: FD.sky, border: false } : { borderColor: FD.lineDark });
  // la columna de texto termina antes de la captura (x 120..650): el título se achica si no entra
  const COL = 530, ts = Math.min(88, Math.floor(88 * COL / Math.max(fdW(s.t1, 88), fdW(s.t2, 88))));
  fdText(s.t1, MARGIN, 490, ts, FD.paper);
  fdText(s.t2, MARGIN, 490 + ts * 1.1, ts, FD.paper);
  fdWrap(s.sub, MARGIN, 600 + ts * 1.1, 40, COL).forEach((ln, i) => fdText(ln, MARGIN, 600 + ts * 1.1 + i * 52, 40, FD.mutedDark, { weight: 500, frac: ev(E0 + 0.3 + i * 0.2, 0.4) }));
}
// parte un texto en líneas que entran en el ancho w
function fdWrap(str, x, y, size, w) {
  const out = []; let cur = '';
  for (const word of str.split(' ')) { const t = cur ? cur + ' ' + word : word; if (fdW(t, size, 500) > w && cur) { out.push(cur); cur = word; } else cur = t; }
  if (cur) out.push(cur); return out;
}

// ---- 6: la ráfaga — tarjetas de un número, alternando celeste y tinta (como los pasos del sitio)
const RUSH = [['40', 'escenarios guiados', FD.sky, FD.ink], ['40', 'clases cortas', FD.ink, FD.paper], ['40', 'cuestionarios', FD.sky, FD.ink], ['2', 'plataformas', FD.ink, FD.paper]];
function sceneRush(i) {
  fillAll(FD.page);
  const [num, label, bg, fg] = RUSH[i];
  fdCard(60, 60, W - 120, H - 120, bg, { r: 40 });
  fdText(num, 240, 640, 400, fg, { weight: 700 });
  fdText(label, 250, 790, 92, fg, { weight: 600 });
  fdText(`0${i + 1}`, 250, 190, 34, bg === FD.sky ? FD.muted : FD.mutedDark, { mono: true, weight: 500, ls: 0 });
  // la flecha queda quieta en su lugar mientras el mundo cambia (ancla de la ráfaga)
  fdHero(1560, 540, 130, { key: 'hero' });
}

// ---- 7: silencio — vuelve la etiqueta de precio, sola
function sceneHush() {
  fillAll(FD.page);
  fdLock(960, 330, 150);
  fdPill('$ por usuario / mes', 960, 600, 64, FD.red, { align: 'center', fill: FD.redSoft, border: false, weight: 600 });
  fdHero(960, 830, 60, { key: 'hero' });
}

// ---- 8: el golpe — la etiqueta pasa a $0
function sceneFree() {
  fillAll(FD.page);
  const k = springMove(TIMELINE.cues.flip, 0.6, 1, SPRING.heavy);
  ctx.save(); ctx.translate(960, 470); ctx.scale(k, k);
  fdText('$0', 0, 120, 360, FD.sky, { weight: 700, align: 'center' });
  ctx.restore();
  // la etiqueta vieja, tachada
  const old = '$ por usuario / mes', ow = fdW(old, 40, 600);
  fdText(old, 960, 180, 40, FD.mutedDark, { align: 'center', weight: 600, ls: 0 });
  ctx.save(); ctx.strokeStyle = FD.red; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(960 - ow / 2 - 10, 166); ctx.lineTo(960 - ow / 2 - 10 + (ow + 20) * ev(19.05, 0.25), 166); ctx.stroke(); ctx.restore();
  fdText('Gratis.', 960, 830, 120, FD.paper, { align: 'center', frac: ev(TIMELINE.cues.gratis, 0.4) });
  // la flecha salta de alegría
  const jump = Math.abs(Math.sin((TT - 19.0) * TAU * 1.0)) * 60 * Math.exp(-(TT - 19.0) * 0.9);
  fdHero(1500, 470 - jump, 100, { key: 'hero', ring: 1 });
}

// ---- 9: el inicio, cambiado
function sceneEnd() {
  fillAll(FD.page);
  const cu = TIMELINE.cues;
  fdText('APRENDÉ', MARGIN, 330, 30, FD.sky, { weight: 600, ls: 4 });
  fdHeadline([['SAP CPI y', FD.paper, 104, 450], ['Power Automate', FD.paper, 104, 570], ['Gratis, en tu navegador.', FD.mutedDark, 56, 660]], { fracs: [1, 1, ev(cu.endText, 0.5)] });
  const ku = popS(cu.url);
  ctx.save(); ctx.translate(MARGIN, 780); ctx.scale(ku, ku); fdPill('flowdev-simulators.vercel.app', 0, 0, 46, FD.ink, { fill: FD.sky, border: false, weight: 600 }); ctx.restore();
  fdHero(1580, 560, 120, { key: 'hero', ring: 0.8 });
}

const SCENES = {
  wish: sceneWish, license: sceneLicense, turn: sceneTurn,
  home: () => sceneStep('home'), stepTheory: () => sceneStep('theory'), stepFlow: () => sceneStep('flow'), stepRun: () => sceneStep('run'), stepVerify: () => sceneStep('verify'),
  rush0: () => sceneRush(0), rush1: () => sceneRush(1), rush2: () => sceneRush(2), rush3: () => sceneRush(3),
  hush: sceneHush, free: sceneFree, end: sceneEnd,
};
