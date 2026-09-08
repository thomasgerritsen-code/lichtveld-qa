# LINAC simulator architecture v10

## Doel

De live simulator gebruikt vanaf v10 één richting voor dataflow:

```
DOM events
   ↓
central store
   ↓
physics calculation
   ↓
simulation result
   ↓
UI renderers / diagnostics / training
```

Physicsmodules schrijven nooit rechtstreeks naar de DOM. Renderers bepalen niet zelf de physics-state. De app-controller is de enige orchestratielaag.

## Mappen

```
src/
├── app/
│   ├── bootstrap.js
│   ├── controller.js
│   ├── state.js
│   ├── store.js
│   └── selectors.js
├── machine/
│   ├── model.js
│   └── control-effects.js
├── physics/
│   ├── beam-model.js
│   ├── beam-state.js
│   ├── feedback.js
│   ├── detector.js
│   ├── radiation-transport.js
│   ├── delivery-state.js
│   ├── math/
│   │   └── matrix.js
│   ├── optics/
│   │   └── elements.js
│   └── bending/
│       └── elements.js
├── ui/
│   ├── machine-renderer.js
│   ├── machine/
│   │   ├── geometry.js
│   │   ├── beam-renderer.js
│   │   ├── target-selector.js
│   │   ├── treatment-head.js
│   │   ├── hardware.js
│   │   └── highlight.js
│   ├── diagnostics.js
│   ├── metrics.js
│   └── training.js
└── data/
    └── sources.js
```

## State

`state.js` is de enige definitie van de application state.

De hoofdgroepen zijn:

- `controls` — dimensieloze sliderwaarden
- `machine` — photon/electron, FF/FFF en CW/CCW
- `beamControl` — Set only / LUT / Servo
- `display` — overlays
- `runtime` — pauze en actieve control-highlight

UI-code verandert de state via actions. De physics-engine ontvangt snapshots van de state en muteert die niet.

## Physics

`beam-model.js` orkestreert de physics maar bevat niet meer alle matrixalgebra zelf.

- `math/matrix.js` — matrix/vector/covariance helpers
- `optics/elements.js` — drift, focus en steering-kick
- `bending/elements.js` — sector-magnet matrices en dispersion kick
- `beam-state.js` — stage snapshot, sigma en R/T-correlatie
- `feedback.js` — gantry environment, LUT en servo
- `detector.js` — photon/electron profiles en virtuele EPID

Hierdoor kan een element worden gewijzigd zonder de DOM-renderer aan te passen.

## Machine en UI

`machine/model.js` bevat machineconfiguratie en visuele parameters.

`machine/control-effects.js` legt vast welk fysiek subsystem bij een UI-control hoort.

`ui/machine-renderer.js` ontvangt alleen berekende physics-resultaten en projecteert die naar SVG.

De overige UI-modules zijn plug-ins voor training, metrics en diagnostics.

## Tests

`npm test` gebruikt Node's ingebouwde test runner. Er zijn geen npm-runtime dependencies nodig.

De regressietests controleren onder andere:

- nominale targetpositie en achromatie;
- 1R heeft geen upstream effect;
- 2R heeft geen effect vóór secondary steering;
- M3 top-up verandert M1/M2 niet;
- Main bending begint bij M1;
- spread verandert de centrale centroid niet;
- centrale store houdt machine-, display- en control-state gescheiden.

De GitHub Actions workflow draait deze tests bij relevante pull requests en pushes naar main.

## Deployment

GitHub Pages blijft een gewone statische site. Er is bewust geen buildstap nodig voor runtime.

De simulator gebruikt native ES modules. Alleen de pagina-link vanuit het dashboard heeft nog een release-query om een oude geopende pagina te omzeilen. Binnen de simulator zijn de handmatige `?v=...` imports verwijderd.

De service worker gebruikt een nieuwe cache-name per release en haalt tijdens normaal gebruik netwerk-eerst op. Daardoor hoeven interne module-imports niet handmatig te worden genummerd.

## Migratie

De map `linac-simulator/js/` bevat tijdelijk de v9-modules als rollbackreferentie. De live v10-pagina importeert uitsluitend `src/app/bootstrap.js` en de nieuwe `src/` boom.

Na één stabiele release kan de oude `js/` map in een afzonderlijke cleanup-PR worden verwijderd.


## Renderer split v11

De machine-renderer is vanaf v11 alleen nog een facade.

- `ui/machine/geometry.js` — pure SVG/machinegeometrie
- `ui/machine/beam-renderer.js` — centroid, envelope, dispersie en vectors
- `ui/machine/target-selector.js` — horizontal target/window carriage + bellows
- `ui/machine/treatment-head.js` — MLC, diaphragms en treatment cone
- `ui/machine/hardware.js` — eenmalige SVG hardware-initialisatie
- `ui/machine/highlight.js` — control → hardware highlighting

Hierdoor kan een visuele wijziging aan bijvoorbeeld de bellows niet meer ongemerkt de beam-path interpolatie of MLC-rendering aanpassen.

## Slider event rule

Een slider-input moet atomisch worden verwerkt. De action `control/input` schrijft daarom in één reducer-pass:
1. de nieuwe controlwaarde;
2. het id van de actieve control voor highlighting.

Er mag niet eerst een aparte highlight-action worden verstuurd en daarna pas de controlwaarde. Dat veroorzaakte in v10 een render tussen beide updates, waardoor de DOM-slider naar de vorige storewaarde terug kon springen.


## Radiation transport layer v12

`physics/radiation-transport.js` ontvangt alleen het berekende `sim`-resultaat plus de geselecteerde mode. Het verandert de 4D electron optics niet.

Output:
- `transportTransmission`
- `targetCoupling`
- `primaryTransmission`
- `doseRatePercent`
- `scatterIndex`
- `events[]`
- `firstStrike`

De UI-laag gebruikt dit resultaat vervolgens op drie plaatsen:
- `beam-renderer.js` stopt de primary ray bij een harde interceptie;
- `scatter-renderer.js` visualiseert secundaire straling op de impactpositie;
- `treatment-head.js` schaalt de treatment cone met de useful-beam transmissie.

Zo blijft de beam-loss/dose-rate logica testbaar zonder SVG of DOM-afhankelijkheid.


## Delivery state v13

`physics/delivery-state.js` is een aparte pure laag tussen radiation transport en UI.

Input:
- radiation-transport result;
- machine power / beam state;
- photon/electron mode en FF/FFF;
- field X/Y;
- dose-rate setpoint.

Output:
- `beamActive`;
- `beamQuality`;
- `setpoint`;
- `usefulDoseRate`;
- `fieldFactor`;
- `patientOutputProxy`;
- operatorstatus.

Belangrijk: de 4D optics wordt altijd berekend zodat de gebruiker de potentiële beam alignment kan bestuderen. De deliverylaag bepaalt vervolgens of er daadwerkelijk straling zichtbaar/actief is. Hierdoor geldt softwarematig één harde regel:

`Machine OFF || Beam OFF => geen bundel, geen scatter, dose rate = 0`

De reducer bewaakt de power/beam invarianten en de renderer kan ze niet lokaal overschrijven.
