# Herbouw v2 — 5 november 2026

De ingang `index.html` gebruikt nu uitsluitend `src/rebuild/app.js`, `src/rebuild/model.js` en `rebuild.css`. De eerdere bootstrap en rendererlagen worden niet meer geladen. De vorige versies zijn terug te vinden in de Git-historie; de oude modules en regressietests blijven aanwezig als historische implementatie, niet als actieve v2-afhankelijkheden.

## Nieuw model

- Componentidentiteit, labels, bronbeschrijving en hoofdgeometrie staan in één modelmodule.
- Dezelfde longitudinale stations en buigsectoren bepalen het bundelpad en de eerste-orde transportelementen.
- De 4D-toestand is `[R, R′, T, T′]`. De volledige 4×4-covariantie wordt met `M Σ Mᵀ` getransporteerd.
- Focus gebruikt een hard-edge solenoïdematrix met rotatie en focusering. De nulveldlimiet is een drift. Deze matrices behouden de symplectische vorm; ze vervangen de oude niet-fysische uniforme compressie van alle bundelspreidingen.
- Steering voegt alleen een lokale hoekverandering toe. De gevolgen verschijnen uitsluitend downstream; een volgende solenoïde kan R en T koppelen.
- De buiging wordt per geometrisch boogsegment door een hard-edge sectormatrix getransporteerd. De hoeken en de positieve booglengtes zijn gedeeld met de illustratie.
- Bronactief, bundelonderschepping en behandelbundel zijn verschillende toestanden. Een onderbroken bron of onderschepte bundel produceert geen relatieve uitvoer onder de target.
- Modus- en filterwisseling zetten de bundel uit. Een expliciete nieuwe start is nodig.

## Nieuw ontwerp

Drie tabbladen: machine, bundeloptiek en onderbouwing. Vier machineaanzichten: volledig, versnellingsbuis, behandelkop en het aanzicht langs de MLC-bundel. Componenten zijn per muis en toetsenbord te selecteren. De MLC-projectie bevat 160 bladeren; de zijdoorsnede twee bladprofielen. Gedeelde koponderdelen blijven bij elektronen aanwezig en de MLC staat geparkeerd. Modelgrenzen staan in de actieve pagina.

## Afbakening van de berekening

De matrixvormen komen uit klassieke paraxiale elektromagnetische bundeloptiek. Hun toepassing hier is een nieuw educatief referentiemodel, geen afleiding van Elekta-magneetstromen of gemeten machine-optiek. Lengtes, veldsterktes, aperturen en de momentumgevoeligheid zijn genormaliseerd. De gekozen nulbundel gaat door de referentie-as; dat bewijst geen realistische commissioning.

Randvelden, volledige achromatische slalomafstemming, RF-fasevangst en bunching, vermogensafhankelijke longitudinale versnelling, space charge, multiple scattering, head transmission, exacte flight-tube/carouselbeweging en Monte-Carlo-dosisberekening ontbreken. De geometrische koproute verklaart welke onderdelen aanwezig zijn; zij is geen materiaalsimulatie. De relatieve uitvoer is een bron-/transmissie-indicator en wordt nadrukkelijk niet als MU/min of dosis getoond. Het tweesigma-apertuurcriterium is geen klinische interlock of volledig particle-loss-model.

Zie [het anatomieonderzoek](linac-anatomy.md) voor de primaire bronnen die de componentopbouw onderbouwen. De controles van v2 toetsen afzonderlijk de wiskundige invarianten en de gebruikersstromen. De oude 172 tests gelden voor de bewaarde eerdere modules; de nieuwe tests zijn herkenbaar aan `rebuild-model.test.mjs`.
