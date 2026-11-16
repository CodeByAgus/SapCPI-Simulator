# flowDev

Plataforma educativa para aprender automatización e integración con flujos: **n8n**, **Make**, **Zapier** y **SAP CPI**.

## Qué incluye

- **Inicio, registro e ingreso**, y un panel con el avance por plataforma.
- **n8n y Zapier:** 7 lecciones, 9 proyectos guiados y 4 cuestionarios por plataforma. Los proyectos están agrupados por tema: primeros pasos, leads, flujos con IA, nodos de programación, conexión con servicios y análisis de datos.
- **Make:** 4 lecciones, 3 proyectos guiados y un cuestionario.
- **Modo libre** en las tres: editor sin requisitos, con datos de entrada y respuestas simuladas (API, IA y hoja de cálculo) que define cada persona.
- Los proyectos se resuelven en un editor de flujos con el vocabulario de cada herramienta, se ejecutan con datos de prueba y se verifican con casos automáticos.
- **SAP CPI** (`sap-cpi/`): taller de iFlows con editor BPMN, 11 escenarios guiados, 20 cuestionarios teóricos, 9 ejercicios extra y modo libre.
- **Próximamente:** Power Automate y Activepieces.

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
