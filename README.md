# flowDev

Plataforma educativa para aprender automatización e integración con flujos en software empresarial: **SAP CPI** y **Microsoft Power Platform**.

## Qué incluye

**Plataformas empresariales**, las que piden las empresas y no se pueden practicar libremente sin licencia:

- **SAP CPI** (`sap-cpi/`): introducción con teoría y el taller de iFlows con editor BPMN, 11 escenarios guiados, 20 cuestionarios teóricos, 9 ejercicios extra y modo libre.
- **Power Platform (Power Automate)**: 20 clases con su cuestionario, taller de cloud flows con 11 escenarios guiados, 9 ejercicios extra y modo libre. Incluye Condition, Switch, Apply to each, variables, Terminate, Filter array, Select, CSV, Excel, SharePoint, Teams, Outlook, Dataverse, aprobaciones, AI Builder, Power BI, Power Apps y flujos de escritorio, con las expresiones reales (`@{triggerBody()?['campo']}`, `body('Accion')`, `items('Apply_to_each')`, `variables('x')`).
- **Próximamente:** MuleSoft y KNIME.

Los talleres comparten la misma distribución: barra con selector de ejercicios, paleta, lienzo con el estilo de cada herramienta y panel con las pestañas Ejercicio, Propiedades y Probar.

## Estructura

```
index.html    estructura de flowDev
styles.css    identidad visual
app.js        contenido, editor de flujos, simulador y cuentas
sap-cpi/      taller de SAP Cloud Integration (index.html, taller.css, taller.js)
vercel.json   configuración del sitio estático
```

## Cómo funciona

Sitio estático sin dependencias ni servidor. Los editores son simuladores: evalúan expresiones, condiciones, bucles y variables en el navegador, y las apps responden con datos de prueba.

Las cuentas y el avance se guardan en el `localStorage` de cada navegador (la contraseña como hash). No se envía ningún dato, una cuenta no sirve en otro dispositivo y no hay recuperación de contraseña.

## Desarrollo local

```bash
python -m http.server 8000
```

## Deploy

En Vercel: importar el repositorio con Framework Preset *Other*, sin comando de build.

## Aviso

Proyecto educativo independiente. SAP, Microsoft, Power Platform, Power Automate, MuleSoft y KNIME son marcas de sus respectivos dueños. Los nombres de empresas, hosts y datos de los ejercicios son ficticios.
