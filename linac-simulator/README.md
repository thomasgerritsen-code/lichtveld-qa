# LINAC bundeltransport simulator

Onderdeel van het RT-VTech / Linac Techniek Dashboard.

## Bestandsstructuur

- `index.html` — responsive UI + SVG-machine
- `simulator.css` — telefoon/tablet/desktop layout
- `js/config.js` — defaults, modelconfiguratie en onderdeelteksten
- `js/beam-model.js` — 2×2 paraxiaal transfer-matrixmodel voor focus/steering
- `js/render.js` — machinegeometrie, slalompad en SVG-rendering
- `js/main.js` — UI-state, events en animatie

## Programmeerbaar houden

Nieuwe beam-physics hoort in `beam-model.js`. Visuele hardware of projectie hoort in `render.js`. Nieuwe bediening hoort in `index.html` en `main.js`. Hierdoor blijft de simulator uitbreidbaar zonder opnieuw één groot HTML-bestand te hoeven wijzigen.

## Modelgrenzen

De functionele volgorde is brongebaseerd, maar exacte Elekta currents, pole-piece-profielen, veldkaarten, toleranties en servicekalibraties zijn niet publiek volledig beschikbaar. Alle sliders zijn daarom dimensieloos en educatief.
