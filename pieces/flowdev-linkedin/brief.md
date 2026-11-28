# flowDev para LinkedIn — brief

**Idea:** no necesitás pagar una licencia para aprender herramientas empresariales: flowDev las simula en el navegador.
**Dispositivo:** el candado de la «Licencia empresarial» se vuelve la flecha de flowDev; al final la etiqueta de precio pasa a $0.

## Especificación
- 1920x1080 (16:9, LinkedIn), 24 fps, 26 s, 120 BPM (un 8vo = 6 cuadros).
- Formato F4 (misión): querer → obstáculo → el ayudante resuelve paso a paso → ráfaga → silencio → golpe → final.
- Estilo: `styles/flowdev` (identidad del sitio: fondo #262624, tarjetas redondeadas, píldoras, la marca celeste con flecha).
- Solo música y texto en pantalla (sin voz). Música compuesta en código.
- Capturas reales del sitio en `assets/` (home, teoría SAP CPI, taller de iFlows con solución, Probar y Verificar en Power Automate).

## Colores con significado
- Celeste #DCEEFB = flowDev (el camino gratis): la flecha, «flowDev», «$0», la URL.
- Rojo #C4453B = la licencia paga (el obstáculo): el candado, «por licencia.», la etiqueta de precio.

## Beats
| # | t | qué pasa | puente | sonido |
|---|---|---|---|---|
| 1 | 0–2 | «Querés aprender las herramientas que usan las empresas» + píldoras SAP CPI / Power Automate; la flecha espera | corte | pad suave |
| 2 | 2–5.5 | tarjeta «Licencia empresarial», candado, «$ por usuario / mes»; la flecha choca y rebota; «Pero se pagan por licencia.» | morph candado → flecha (5.5) | golpe sordo en el rebote |
| 3 | 5.5–6.5 | «Con flowDev, no.» | corte | whoosh, golpe medio |
| 4 | 6.5–8 | el sitio real: «Simuladores en tu navegador» | corte | arranca el groove |
| 5 | 8–16 | 01 teoría · 02 armá el flujo · 03 probalo paso a paso · 04 verificá (capturas reales, puntero y resaltado) | cortes | groove, un acento por paso |
| 6 | 16–18 | ráfaga: 40 escenarios · 40 clases · 40 cuestionarios · 2 plataformas | corte | un golpe por tarjeta (lo más denso) |
| 7 | 18–19 | silencio: la etiqueta de precio, sola | corte | casi nada |
| 8 | 19–22 | «$0» · «Gratis.» | corte | el golpe más fuerte |
| 9 | 22–26 | el inicio, cambiado: «Aprendé SAP CPI y Power Automate. Gratis, en tu navegador.» + URL | fin | acorde plano |

## Afirmaciones y fuentes
- «Se pagan por licencia»: Power Automate Premium cuesta USD 15 por usuario/mes (precio de EE. UU.) — https://www.microsoft.com/power-platform/products/power-automate/pricing ; SAP Integration Suite se vende en planes de suscripción — https://www.sap.com/products/technology-platform/integration-suite/pricing.html . Ambas tienen pruebas o niveles gratis limitados (https://blogs.sap.com/2021/11/17/sap-integration-suite-free-tier-is-now-available-on-sap-btp/), por eso el video no dice «no se puede practicar sin pagar».
- «40 escenarios, 40 clases, 40 cuestionarios, 2 plataformas»: catálogo del propio sitio (app.js: 20 + 20 de cada tipo en SAP CPI y Power Automate).
- «Gratis»: flowDev es gratuito.
