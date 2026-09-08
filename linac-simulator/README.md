# LINAC bundeltransport simulator

Onderdeel van het RT-VTech / Linac Techniek Dashboard.

## Bestandsstructuur

- `index.html` — responsive UI + volledige SVG-machine
- `simulator.css` — telefoon/tablet/desktop layout
- `js/config.js` — defaults, geometrische modelconfiguratie en onderdeelteksten
- `js/beam-model.js` — gekoppeld 4D R/R′/T/T′-model, covariance-transport en D/D′-dispersie
- `js/feedback.js` — gantry-afhankelijke verstoring, LUT en chamber-servo onderwijsmodel
- `js/detector.js` — relatieve FF/FFF photonprofielen, electron fluence en virtuele EPID-geometrie
- `js/render.js` — machinegeometrie, 1σ/2σ envelope, slalompad, electron scattering en Agility leaf-tip visualisatie
- `js/diagnostics.js` — dual-plane views, profiles, chamber readouts, EPID QA en source-audit
- `js/training.js` — dimensieloze oefenscenario's en scorelogica
- `js/metrics.js` — live 4D beam state / D / D′ / σR / σT / R-T correlatie
- `js/sources.js` — bronmetadata, machinefamilie en confidence per claim
- `js/main.js` — state, twee-pass LUT/servo-loop, events en animatie

## Physics v5

De simulator gebruikt nu één gekoppelde toestand:

`[R, R′, T, T′]`

De electron-optics vóór de bend gebruikt 4×4 lineaire transportmatrices. Focus 1 en Focus 2 zijn als geroteerde anisotrope thin-lens elementen gemodelleerd zodat R/T-koppeling zichtbaar wordt zonder te doen alsof publieke OEM solenoid-fieldmaps beschikbaar zijn.

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

De machine-side-view is een radiale projectie. Een 1T/2T-correctie kan daarom vooral in de transverse diagnostic view zichtbaar zijn; R/T-koppeling door de vereenvoudigde focusmatrices kan downstream wel een klein radiaal effect geven.

De bending- en momentumrespons is gerefereerd aan de vaste nominale flight-tube orbit. Daardoor geeft een bending-field/momentum mismatch een lokale hoekfout op de juiste magneetpositie in plaats van een kunstmatige verplaatsing over de volledige bend.
