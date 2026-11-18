# flowDev

Plataforma educativa para aprender automatización e integración con flujos: **n8n**, **Make**, **Zapier** y **SAP CPI**.

## Qué incluye

**Plataformas empresariales**, las que piden las empresas y no se pueden practicar libremente sin licencia:

- **SAP CPI** (`sap-cpi/`): introducción con teoría y el taller de iFlows con editor BPMN, 11 escenarios guiados, 20 cuestionarios teóricos, 9 ejercicios extra y modo libre.
- **Power Automate**: taller de cloud flows con 5 lecciones, 6 proyectos (leads, aprobaciones, Switch, AI Builder, Excel y HTTP), 4 cuestionarios y modo libre. Usa las expresiones reales de Power Automate (`@{triggerBody()?['campo']}`, `body('Accion')`, `items('Apply_to_each')`).
- **Próximamente:** MuleSoft y KNIME.

**Primeros pasos**, con herramientas gratuitas para aprender los conceptos: n8n, Make y Zapier, cada una con su taller (workflows, escenarios y Zaps), teoría, proyectos, cuestionarios y modo libre.

Todos los talleres comparten la misma distribución: barra con selector de ejercicios, paleta, lienzo con el estilo de cada herramienta y panel con las pestañas Ejercicio, Propiedades y Probar.

## Estructura

```
index.html    estructura de flowDev
styles.css    identidad visual
app.js        contenido, editor de flujos, simulador y cuentas
sap-cpi/      taller de SAP Cloud Integration (index.html, taller.css, taller.js)
vercel.json   configuración del sitio estático
```

## Cómo funciona

Sitio estático sin dependencias ni servidor. Los editores son simuladores: evalúan expresiones (`{{ $json.campo }}`, `{{1.campo}}`), condiciones y bifurcaciones en el navegador, y las apps responden con datos de prueba.

Las cuentas y el avance se guardan en el `localStorage` de cada navegador (la contraseña como hash). No se envía ningún dato, una cuenta no sirve en otro dispositivo y no hay recuperación de contraseña.

## Desarrollo local

```bash
python -m http.server 8000
```

## Deploy

En Vercel: importar el repositorio con Framework Preset *Other*, sin comando de build.

## Aviso

Proyecto educativo independiente. n8n, Make, Zapier, SAP, Power Automate y Activepieces son marcas de sus respectivos dueños. Los nombres de empresas, hosts y datos de los ejercicios son ficticios.
