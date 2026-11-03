# Taller de iFlows

Simulador para practicar la creación de iFlows de SAP Cloud Integration desde el navegador, sin tenant ni instalación.

## Qué incluye

- **Escenarios guiados (11):** HTTPS, SFTP, PGP, Data Store, Router, Message Mapping, Multicast, AMQP, OData, IDoc, RFC, SOAP, Splitter, Local Integration Process y Open Connectors.
- **Cuestionarios teóricos (20):** uno por clase, con corrección, explicación y botón para ver la respuesta.
- **Práctica extra (9) y modo libre.**
- Editor visual con paleta, conexiones y hoja de propiedades parecida a la de CPI.
- Botón **Check** (errores de modelado), **Probar** (trace paso a paso con headers, properties y body) y **Verificar** (comprobaciones automáticas de cada ejercicio).

## Cómo funciona

Es un único archivo `index.html` con HTML, CSS y JavaScript sin dependencias. El motor de simulación corre en el navegador: XPath con `document.evaluate`, expresiones Camel Simple (`${header.x}`, `${property.x}`) y un subconjunto de Groovy traducido a JavaScript. Los sistemas destino responden con datos de prueba. El avance se guarda en el `localStorage` de cada navegador; no hay servidor ni base de datos y no se envía ningún dato.

## Desarrollo local

Abrí `index.html` en el navegador, o serví la carpeta:

```bash
python -m http.server 8000
```

## Deploy

Sitio estático: en Vercel se importa el repositorio sin framework ni comando de build (Framework Preset: *Other*, Output Directory: raíz).

## Aviso

Proyecto educativo independiente, sin afiliación con SAP SE. SAP y SAP Integration Suite son marcas de SAP SE. Los nombres de empresas, hosts y datos de los ejercicios son ficticios. El simulador es una aproximación simplificada y no reemplaza la práctica en un tenant real.
