# LINAC bundeltransport simulator

Onderdeel van het RT-VTech / Linac Techniek Dashboard.

## Bestandsstructuur

- `index.html` — responsive UI + SVG-machine
- `simulator.css` — telefoon/tablet/desktop layout
- `js/config.js` — defaults, modelconfiguratie en onderdeelteksten
- `js/beam-model.js` — paraxiaal transfer-matrixmodel voor focus/steering plus genormaliseerd sector-magnetmodel in het bending-vlak
- `js/render.js` — machinegeometrie, slalompad en SVG-rendering
- `js/training.js` — dimensieloze oefenscenario's en scorelogica
- `js/metrics.js` — live R/R′/T/T′/dispersie-tabel per element
- `js/main.js` — UI-state, events en animatie

## Programmeerbaar houden

Nieuwe beam-physics hoort in `beam-model.js`. Visuele hardware of projectie hoort in `render.js`. Trainingsscenario's blijven geïsoleerd in `training.js`; de tabelweergave in `metrics.js`. Zo kunnen fysica, UI en machinevorm onafhankelijk worden uitgebreid.

## Huidig model

De electron-optics vóór de bend gebruikt lineaire 2×2 paraxiale matrices: drift, thin-lens focus en steering-kicks. Het radiale bending-vlak gebruikt een genormaliseerde sector-magnet transfermatrix met een lineaire dispersieterm. Voor het transverse vlak van M1/M2/M3 worden geen niet-publieke Elekta field maps verzonnen; daar blijft het model bewust eenvoudiger.

De live tabel toont voor Gun, Focus 1, 1R/1T, Focus 2, 2R/2T, bend entry, M1, M2, M3 en target:
- R en R′
- T en T′
- relatieve dispersie
- relatieve bundelbreedte σ

## Training

De training injecteert uitsluitend verborgen, dimensieloze modelafwijkingen:
- radiale bronpositie/hoek
- transverse bronpositie/hoek
- bending coarse/fine mismatch

De gebruiker corrigeert deze met de bijbehorende virtuele controls. Tijdens de oefening tonen twee live meters de target-positie en target-hoek (of target-offset en dispersie bij de bending-oefening), plus een stapsgewijze uitleg van de verschillende response-vectoren van de eerste en tweede corrector. Scores en instellingen zijn niet te vertalen naar een echte LINAC.

## Modelgrenzen

De functionele volgorde is brongebaseerd, maar exacte Elekta currents, pole-piece-profielen, veldkaarten, toleranties en servicekalibraties zijn niet publiek volledig beschikbaar. Alle sliders en scores zijn daarom dimensieloos en educatief.
