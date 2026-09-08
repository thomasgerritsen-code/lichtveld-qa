# LINAC bundeltransport simulator

Onderdeel van het RT-VTech / Linac Techniek Dashboard.

## Bestandsstructuur v10

De live applicatie gebruikt nu de `src/`-boom:

- `src/app/` — centrale state, reducer/store, selectors en controller
- `src/machine/` — machineconfiguratie en control → hardware mapping
- `src/physics/` — 4D beam physics, covariance, bending, feedback en detector
- `src/ui/` — SVG-renderer, diagnostics, metrics en training
- `src/data/` — bron-audit
- `tests/` — automatische regressietests
- `ARCHITECTURE.md` — volledige dataflow en ontwikkelregels

De oude `js/`-map blijft tijdelijk alleen als v9 rollbackreferentie aanwezig. `index.html` laadt hem niet meer.


## Physics v5

De simulator gebruikt nu één gekoppelde toestand:

`[R, R′, T, T′]`

De electron-optics vóór de bend gebruikt 4×4 lineaire transportmatrices. In v5 waren Focus 1 en Focus 2 nog geroteerde thin-lens elementen; **v14 vervangt dit bewust door pure opeenvolgende envelope-compressie** zodat de focus-sliders alleen σR/σT versmallen en de centroidbaan niet verplaatsen.

De bundelbreedte wordt niet meer met een losse schaalfactor getekend. Een 4×4 covariance-matrix `Σ` wordt per element gepropageerd met:

`Σout = M Σin Mᵀ`

De hoofdtekening en de twee diagnostische beam views tonen daarvan relatieve 1σ- en 2σ-envelopes.

## Slalom bending

M1/M2/M3 gebruiken genormaliseerde sector-magnet matrices in het radial plane. De dispersie-vector `D/D′` wordt afzonderlijk gepropageerd. De interne dispersion coefficients zijn alleen zo getuned dat het nominale onderwijsmodel achromatisch reconvergeert; dit zijn geen Elekta pole-piece parameters of veldkaarten.

Terminologie in de UI:
- **Main bending supply** — gezamenlijke modelbijdrage aan M1/M2/M3
- **M3 top-up / fine channel** — extra laatste-magneettrim

## Gantry, LUT en servo

De gantry slider introduceert een kleine genormaliseerde gantry-angle afhankelijke beam disturbance, inclusief een richtingsterm voor CW/CCW.

Drie beam-control modi:
- Set only
- Set + LUT
- Set + LUT + Servo

De servo is een gesloten onderwijsloop in twee rekenstappen:
1. bereken beam + chamber tilt met Set/LUT;
2. bereken een proportionele secondary steering correctie en simuleer opnieuw.

Werkelijke Elekta LUT waarden, servo gains, steering currents en toleranties worden niet gebruikt.

## Treatment head en detector

Photon mode koppelt target position/angle aan relatieve radial/transverse profiles:
- FF — relatief vlak profiel
- FFF — centraal gepiekt profiel

Electron mode volgt een ander pad:
- electron window
- scattering foils
- verbrede fluence
- applicator / trimmers
- patiënt

De Agility MLC is schematisch verbeterd met afgeronde/eccentrische leaf tips en blijft expliciet onder het confidence/model-grens systeem vallen.

## Virtuele QA

De EPID/focal-spot QA panel visualiseert alleen het geometrische principe dat focal-spot offset verschillende geprojecteerde centra van MLC en diaphragms kan geven. Er zijn bewust geen klinische toleranties of stap-voor-stap service/kalibratie-instructies opgenomen.

## Bron-audit

`sources.js` legt per claim vast:
- bron
- bronsoort
- machinefamilie/scope
- confidence
- expliciete modelgrens

Belangrijkste bronfamilies:
- Elekta fabrikantinformatie
- IAEA Radiation Oncology Physics
- Elekta triple-magnet patent
- van Appeldoorn et al. over Focus/1R-1T/Focus/2R-2T en gantry LUT/servo
- Chojnowski et al. over Agility focal spot / MLC / diaphragms
- Hernandez et al. over Agility leaf geometry
- Versa HD FF/FFF beam-characterisation literatuur

## Modelgrenzen

De simulator is educatief. Alle sliders, scores, LUT/servo correcties, magnetische response-coefficients, profile shifts en QA readouts zijn dimensieloos. Exacte Elekta currents, service-items, tolerantiegrenzen, poolprofielen, field maps, calibration procedures en klinische dose data zijn niet gereconstrueerd.


## Geometry scale v6

De hoofdtekening gebruikt vanaf v6 een compactere bending-assembly. De eerdere SVG liet M1/M2/M3 visueel bijna even groot worden als de complete acceleratorsectie. Dat past niet bij de gepubliceerde Elekta-transportfiguren.

Bronnen die voor de relatieve schaal zijn gebruikt:
- Paynter (University of Leeds), Figure 16: Elekta electron transport system
- Waldron / AAPM refresher course: conceptual 22° → 45° down → 45° up → 112.5° down slalom layout
- Elekta patent: bevestigt de compacte triple-magnet array rond de flight tube en de functies van M1, M2 en M3

De visuele bendingsectie is daarom teruggebracht naar ongeveer 0,58 van de vorige SVG-schaal. De verhouding van de complete bendingsectie tot de getekende waveguide komt daarmee ongeveer in het bereik van de gepubliceerde transportfiguren.

Dit is nadrukkelijk een **relatieve bron-geankerde visualisatie**. Publieke bronnen geven geen betrouwbare OEM-maatvoering van de afzonderlijke pole pieces/coils waarmee een exacte mechanische tekening in millimeters kan worden gereconstrueerd.


## Photon ↔ Electron target selector v7

De target/window selectie is nu zichtbaar in de machineweergave.

Bronbasis:
- de AAPM/Waldron Elekta-slalomfiguur beschrijft dat de vacuum bellows beweging van de flight tube mogelijk maakt;
- de flight tube selecteert verschillende uitgangsposities;
- één uitgang bevat de X-ray target en een andere uitgang het electron window;
- Paynter beschrijft de flight tube als het deel dat de elektronen na M1/M2/M3 op target of exit window focust.

Gedrag in de app:
1. de elektronenbaan door de magneten blijft bij de moduswissel geometrisch vast;
2. de corrugaties van de bellows bewegen progressief;
3. de flight-tube carriage verschuift;
4. in Photon mode staat de target in de vaste elektronenbaan;
5. in Electron mode schuift de target uit de baan en het electron window erin.

De weergegeven slag (26 SVG-pixels langs de schematische selector-as) is uitsluitend een visuele, dimensieloze animatie. Dit is geen Elekta OEM-mechanische verplaatsingsmaat en geen service-instelling.


## Horizontal target shift v8

De v7 animatie bewoog de selector langs de acceleratorhoek. Dat is gecorrigeerd.

Voor de normale Photon ↔ Electron modewissel beschrijft Elekta's target-shift documentatie dat:
- een motor/drive de **flight tube en target horizontaal** tussen twee home positions verplaatst;
- de stainless-steel bellows de flight tube laat bewegen ten opzichte van de waveguide terwijl het vacuum behouden blijft;
- de flight tube zich tussen de pole pieces van de bending magnet assembly bevindt.

Daarom toont v8:
- horizontale beweging van flight tube + target/window;
- progressieve horizontale vervorming van de bellows;
- vaste M1/M2/M3-hardware tijdens de modewissel;
- een vaste electron-beam trajectory door de bending magnets.

De bending magnet assembly kan als mechanische assembly bij alignment/maintenance worden verplaatst, maar dat is geen onderdeel van de normale Photon ↔ Electron target-shift animatie.

De visuele slag blijft dimensieloos en is geen OEM mechanische maat.


## Control causality v9

De slider-visualisatie is vanaf v9 per fysiek element gesegmenteerd. Dit voorkomt dat een correctie zichtbaar vóór het element optreedt.

Causale mapping:
- Focus 1 → verandert centroidhoek/envelope pas vanaf Focus 1
- 1R / 1T → lokale steering-kick bij primary steering; upstream ongewijzigd
- Focus 2 → pas downstream van Focus 2
- 2R / 2T → pas downstream van secondary steering
- Electron momentum → verandert relatieve magnetische rigiditeit; nominale waarde = 1.00
- Energiespreiding → centrale ray blijft gelijk; chromatische separation/envelope ontstaat vanaf M1
- Main bending supply → beïnvloedt M1, M2 en M3 vanaf M1
- M3 top-up → geen effect vóór M3
- Veld X → beweegt zichtbaar de Agility MLC leaf banks
- Veld Y → beweegt zichtbaar de diaphragms
- Gantry → globale genormaliseerde disturbance + optionele LUT/servo response

De machine-side-view is een radiale projectie. Een 1T/2T-correctie is daarom vooral in de transverse diagnostic view zichtbaar. Vanaf v14 geven Focus 1/2 geen centroid R/T-koppeling meer; zij veranderen alleen de envelope.

De bending- en momentumrespons is gerefereerd aan de vaste nominale flight-tube orbit. Daardoor geeft een bending-field/momentum mismatch een lokale hoekfout op de juiste magneetpositie in plaats van een kunstmatige verplaatsing over de volledige bend.


## Architecture v10

V10 is bewust een interne refactor: de zichtbare functies en de v9 beam-control causality blijven behouden, maar de code is opgesplitst in application state, physics, machine, data en UI.

Belangrijkste wijzigingen:
- één centrale store in plaats van losse globale variabelen;
- één controller als orchestratielaag;
- physics bevat geen DOM-code;
- matrix-, optics- en bending-elementen zijn aparte modules;
- renderers ontvangen een berekend simulation result;
- interne handmatige `?v=...` moduleversies zijn verwijderd;
- dependency-free Node regressietests;
- GitHub Actions test iedere relevante pull request.

Zie [ARCHITECTURE.md](./ARCHITECTURE.md) voor de ontwikkelstructuur.


## Renderer / slider fix v11

V11 corrigeert een architectuurregressie uit v10: slider-input werd in twee afzonderlijke store-actions verwerkt. De eerste action activeerde highlighting en veroorzaakte direct een render; die render kon de slider terugzetten voordat de nieuwe waarde was opgeslagen.

De nieuwe `control/input` action verwerkt waarde + highlight atomisch en veroorzaakt één store-notificatie.

Daarnaast is de monolithische machine-renderer opgesplitst in:
- geometry
- beam renderer
- target/bellows selector
- treatment head / MLC
- hardware initialization
- highlighting

Een regressietest controleert expliciet dat één slider-input één notification geeft en tegelijk zowel de controlwaarde als de actieve highlight opslaat.


## Beam loss, scatter en relatieve dose rate v12

V12 voegt een aparte `radiation-transport.js` laag toe bovenop de bestaande 4D beam physics.

De beam centroid wordt per transportelement vergeleken met een **genormaliseerde virtuele aperture**. Bij toenemende afwijking:
1. blijft de primary beam eerst volledig door;
2. ontstaat gedeeltelijke beam interception en wall scatter;
3. daalt de useful-beam transmissie;
4. bij een harde wall strike stopt de primaire ray op die positie;
5. de relatieve dose rate aan het patiëntvlak kan daardoor uiteindelijk 0% worden.

De target/window heeft daarnaast een afzonderlijke genormaliseerde position/angle acceptance. Een bundel kan dus de flight tube volledig passeren maar de target missen; in Photon mode resulteert dat in vrijwel geen useful photon output en extra lokale scatter aan de target/head-regio.

De UI toont:
- relatieve dose rate 0–100%;
- transport transmissie;
- scatter-index;
- eerste beam interception;
- een dose-rate balk;
- scatter-bursts op de positie waar de beam materiaal raakt.

Een klein normaal head-scatter component blijft in Photon mode zichtbaar wanneer de useful beam aanwezig is.

### Belangrijke modelgrens

De apertures, scatter yield, target acceptance en dose-rate respons zijn **dimensieloze onderwijsparameters**. Ze zijn niet afkomstig uit Elekta OEM bore-afmetingen, leakage-specificaties of klinische calibraties. De output is daarom relatief ten opzichte van de nominale output van de geselecteerde modus en wordt niet in Gy/min weergegeven.

De bron-audit koppelt dit model aan literatuur over het onderscheid tussen primary radiation, head/collimator scatter, leakage en overige secondary radiation, maar de numerieke v12-respons is bewust een simulatorproxy.


## Treatment console / machine state v13

V13 voegt een afzonderlijke operatorlaag toe bovenop de bestaande beam-physics.

### Machine state
- Machine Power heeft een expliciete ON/OFF-state.
- BEAM ON kan alleen worden geactiveerd wanneer Machine Power ON is.
- Machine Power OFF forceert onmiddellijk BEAM OFF.
- Photon ↔ Electron modewissel forceert BEAM OFF.
- Wanneer BEAM OFF is, worden electron particles, primary beam, treatment cone, scatter en monitor-chamber dose-signalen niet gerenderd.

De store bewaakt deze invarianten, zodat de UI ze niet per ongeluk kan omzeilen.

### Integrity-style dose rate
De console biedt een continu dose-rate setpoint van 37–600 MU/min, gebaseerd op publiek beschreven Integrity/CVDR-functionaliteit. Het getoonde useful dose-rate model is:

`useful rate = setpoint × normalized beam transmission`

De machine kan dus bijvoorbeeld op 600 MU/min ingesteld staan terwijl een slecht gestuurde beam minder useful output levert of volledig wordt onderschept.

Dit is een onderwijsproxy. Het simuleert geen echte Elekta dose servo, PRF-code, calibration response of clinical interlock thresholds.

### Veldgrootte
Veld X en Y worden vanaf v13 in centimeter op isocenter ingevoerd:
- X = Agility MLC-richting
- Y = orthogonale diaphragms
- instelbaar 1–40 cm
- presets 5×5, 10×10, 20×20, 30×30 en 40×40 cm

De 40×40 cm bovengrens en Agility-architectuur zijn publiek gedocumenteerd.

### Field-output proxy
Voor photon mode wordt de rechthoekige opening via een equivalent-square benadering samengevat. Het output-factor model is exact 1.000 bij 10×10 cm en volgt alleen de brede publiek gerapporteerde Versa HD trend tussen kleine en grote velden. FF en FFF hebben verschillende curves.

Dit is nadrukkelijk geen commissioning table en mag niet als dose-calibratiedata worden gebruikt.

### UI
De donkere console, statusblokken en groene active-state cues zijn geïnspireerd op publiek beschikbare Elekta Integrity/Harmony/Versa HD beelden. Er zijn geen OEM screenshots, assets of pixel-exacte interface-elementen gekopieerd.


## Focus, steering en magnetron/RF v14

V14 maakt drie grote onderwijswijzigingen.

### Focus 1 en Focus 2

Op verzoek zijn de focus-sliders niet langer gekoppeld aan centroidpositie of centroidhoek.

- Focus 1 comprimeert alleen de relatieve beam envelope `σR/σT`.
- Focus 2 werkt downstream als een tweede, extra envelope-compressie.
- Focus 2 kan daardoor een al door Focus 1 versmalde bundel nog verder versmallen.
- De centrale ray verandert door de focus-sliders zelf niet.

Dit is bewust een visuele/educatieve vereenvoudiging. Van Appeldoorn et al. beschrijven dat echte Elekta focuscoils ook een helical rotation van electron trajectories veroorzaken. V14 laat die coupling expres niet zien zodat de focusfunctie visueel eenduidig blijft.

### Steering naar de waveguide-wand

De acceleratorsectie heeft extra samplepunten:
- `wgAfter1`
- `wgAfter2`
- `wgExit`

1R/1T en 2R/2T geven nog steeds lokale centroid-angle kicks. De daaropvolgende drift kan de centroid tegen een genormaliseerde virtuele waveguide-aperture laten lopen. Bij gedeeltelijke clipping daalt de transmissie en ontstaat scatter; bij een harde interceptie stopt de primary electron ray op dat punt en wordt useful dose rate nul.

De aperturewaarden zijn uitsluitend simulatorparameters en zijn geen Elekta bore-, damage- of interlockgrenzen.

### Magnetron en RF

Er is een afzonderlijke `physics/rf-source.js` laag toegevoegd met:
- gun emission;
- gun timing;
- magnetron RF power;
- magnetron tune / AFC offset;
- RF phase.

Daaruit worden uitsluitend genormaliseerde grootheden afgeleid:
- RF efficiency;
- electron capture;
- source factor;
- effective electron momentum;
- effective energy spread.

Deze factoren beïnvloeden vervolgens beam envelope, steering rigidity, bending response, waveguide loss en useful dose rate.

Geen echte magnetronfrequenties, RF-vermogens, pulslengtes, gun currents, AFC-waarden of serviceparameters worden gebruikt.

### Animatie volgens Elekta's publieke uitleg

De visuele volgorde is afgestemd op Elekta's publieke video **How the linear accelerator works**:

1. magnetron/RF-bron activeert;
2. RF-pulsen lopen naar en door de travelling waveguide;
3. electronen worden door de waveguide getransporteerd;
4. Focus 1 en Focus 2 versmallen de getekende envelope;
5. steering kan de centroid in de waveguide-wand sturen;
6. de bundel passeert de slalom bending;
7. in photon mode pulseert de tungsten target wanneer useful electron output aankomt;
8. de treatment cone en monitor-output volgen de beschikbare useful beam.

Bronnen voor deze laag zijn Elekta's eigen video/pagina, Paynter's Elekta transportdiagram, Cashmore's travelling-wave/magnetron beschrijving en van Appeldoorn et al. voor de Focus/1R-1T/Focus/2R-2T volgorde.
