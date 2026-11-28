  // SCORE — flowDev LinkedIn (dentro de buildScore(); ver kit/score-head.js). 120 BPM, en D.
  // Arco: fino al inicio → golpe sordo en el rebote → whoosh en el giro → groove en los pasos →
  // la ráfaga es lo más denso → silencio (18–19s) → el golpe más fuerte en $0 (19.0) → acorde plano y cola.
  const cu = TIMELINE.cues;
  to = 'm';
  // 1-2: un pad suave mientras se plantea el deseo y la licencia
  pad(0.0, 5.0, ['D3', 'A3', 'Fs4'], 0.025, { type: 'triangle', cut: 900, att: 0.6, rel: 0.4 });
  pluck(0.05, nz('D4'), 0.12, -0.2, 0.6, 2200, 0.35); pluck(0.55, nz('Fs4'), 0.1, 0.1, 0.6, 2200, 0.35);
  pluck(cu.pills, nz('A4'), 0.13, -0.2); pluck(cu.pills + 0.15, nz('D5'), 0.12, 0.2);
  // 2: aparece el candado (nota baja, menor), la etiqueta, el choque
  to = 's';
  blip(cu.lock, 520, 260, 0.12, 0.12);
  noiseHit(cu.tag, 0.05, 'bandpass', 2400, 2, 0.12, 0.3);
  sub(cu.bump, 0.35); noiseHit(cu.bump, 0.12, 'lowpass', 600, 1, 0.3);
  to = 'm';
  pluck(cu.cap2, nz('E4'), 0.1, 0, 0.5, 1600); pluck(cu.cap2 + 0.25, nz('Cs5') / 2, 0.09, 0, 0.5, 1400);
  // 3: el giro — whoosh hacia el morph y un golpe medio cuando nace la flecha
  to = 's';
  sweep(4.95, 5.48, 0.05, 500, 4200, 0);
  to = 'm';
  chime(5.5, [nz('D5'), nz('A5')], 0.08); sub(5.5, 0.25);
  // 4-5: el groove de los pasos (bajo en negras, plucks en 8vos), un acento por corte
  for (let b = 6.5; b < 16.0 - 1e-6; b += BEAT) bass(b, nz(['D3', 'D3', 'A2', 'A2', 'B2', 'B2', 'G3', 'A2'][Math.floor((b - 6.5) / BEAT) % 8]) , 0.22);
  for (let b = 8.0; b < 16.0 - 1e-6; b += E8) pluck(b, nz(['D4', 'Fs4', 'A4', 'Fs4'][Math.round(b / E8) % 4]), 0.07, Math.sin(b) * 0.4, 0.22, 2600, 0.15);
  [6.5, 8.0, 10.0, 12.0, 14.0].forEach((t, i) => { to = 's'; noiseHit(t, 0.05, 'highpass', 5000, 0.8, 0.06); to = 'm'; pluck(t, nz(['A4', 'D5', 'E5', 'Fs5', 'A5'][i]), 0.11, 0, 0.4, 3400, 0.3); });
  pad(6.5, 16.0, ['D3', 'A3', 'E4'], 0.018, { type: 'triangle', cut: 1100, att: 0.5, rel: 0.3, swellTo: 0.03, swellAt: 15.5 });
  // 6: la ráfaga — un golpe por tarjeta, lo más denso
  // un colchón continuo (sube la mediana: es la parte más densa) y golpes más chicos que el de $0
  pad(16.0, 17.98, ['D3', 'A3', 'D4', 'E4'], 0.02, { type: 'sawtooth', cut: 1600, att: 0.05, rel: 0.05, send: 0.1 });
  for (let b = 16.0; b < 18.0 - 1e-6; b += E8) bass(b, nz(['D3', 'D3', 'A2', 'A2', 'B2', 'B2', 'A2', 'A2'][Math.round((b - 16.0) / E8)]), 0.14);
  for (let i = 0; i < 4; i++) { const t = 16.0 + i * 0.5; sub(t, 0.05); pluck(t, nz(['D5', 'Fs5', 'A5', 'D6'][i]), 0.055, (i % 2 ? 0.3 : -0.3), 0.3, 4200, 0.2); for (let j = 1; j < 4; j++) { to = 's'; noiseHit(t + j * E16, 0.04, 'highpass', 6000, 0.8, 0.04, (j % 2 ? 0.4 : -0.4)); to = 'm'; } }
  to = 's'; riser(17.2, 17.98, 0.018); to = 'm';
  // 7: silencio — nada arranca entre 18.0 y 19.0 (solo un tono de sala casi inaudible)
  drone(18.02, 18.98, nz('D3'), 0.004, { att: 0.2, rel: 0.2 });
  // 8: el golpe más fuerte — acorde corto + sub, después un acorde plano (receta de craft.md)
  chime(19.0, [nz('D5'), nz('Fs5'), nz('A5'), nz('D6')], 0.2); sub(19.0, 0.6);
  pluck(19.0, nz('D4'), 0.22, 0, 0.5, 4500, 0.4);
  pad(19.05, 22.0, ['D3', 'A3', 'D4', 'Fs4'], 0.07, { cut: 1500, att: 0.15, rel: 0.25, send: 0.5 });
  // 9: el final — el motivo del inicio, resuelto, y la cola
  pluck(22.0, nz('D4'), 0.06, -0.2, 0.6, 2000, 0.35); pluck(22.5, nz('Fs4'), 0.06, 0.1, 0.6, 2000, 0.35); pluck(23.0, nz('A4'), 0.065, -0.1, 0.8, 2200, 0.4); pluck(23.0, nz('D5'), 0.05, 0.2, 1.2, 2200, 0.5);
  pad(22.0, 26.0, ['D3', 'A3', 'Fs4'], 0.011, { type: 'triangle', cut: 800, att: 0.6, rel: 1.6 });
