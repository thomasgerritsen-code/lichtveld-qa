# Audit van alle tien schuifregelaars — 5 november 2026

Deze audit toetst de koppeling van de educatieve rekenuitkomsten aan de tekening. Hij maakt de genormaliseerde simulator niet tot een klinisch gekalibreerde versneller.

| Schuif | Gecontroleerd effect | Correctie in de weergave / berekening |
|---|---|---|
| Focus 1 | Transport vanaf de eerste spoel; bandbreedte en covariantie veranderen | Zichtbare ±2σ-band uit dezelfde berekende punten. De veldwerking wordt over de daadwerkelijke spoellengte geïntegreerd; het magneetlichaam toont datzelfde gebied |
| Focus 2 | Downstream focusering en R/T-koppeling; geen upstream verandering | Zelfde gesegmenteerde solenoïdewerking; de targetdoorsnede toont positie én beide bundelbreedtes |
| 1R | Lokale radiale kick; daarna eventuele rotatie door Focus 2 | Causaal getekend uit dichter bemonsterde transportpunten; tegengestelde waarden geven tegengestelde afwijkingen |
| 1T | Lokale transverse kick; Focus 2 kan dit naar R koppelen | Aparte R/T-targetdoorsnede en twee bundelgrafieken voorkomen dat alleen een radiaal zijaanzicht voor T wordt aangezien |
| 2R | Alleen downstream radiale verandering | De lijn en band blijven vóór de spoel gelijk |
| 2T | Alleen downstream transverse verandering, zonder latere focus-R/T-koppeling | Het radiale machinespoor blijft gelijk; de T-targetpositie en transverse grafiek veranderen |
| Momentum | Focussterkte/rigiditeit en buigrespons | De momentumafwijking wordt binnen ieder boogsegment toegepast, in plaats van als een plotselinge kick aan de magneetuitgang |
| Bronsterkte | Intensiteit / relatieve uitvoer, geen positie of energie | Opaciteit van elektronenbundel, behandelbundel en actieve targetspot volgt de bronsterkte. Bij nul verdwijnen de actieve bundels |
| Veld X | X-afmeting, zonder wijziging van upstream elektronenoptiek | Eén projectief veldmodel verbindt isocentrum, downstream MLC-vlak en behandelbundel. Elektronenmodus houdt de MLC geparkeerd en past de getekende applicatoropening aan |
| Veld Y | Loodrechte Y-afmeting, onafhankelijk van X | De diafragmaopening beweegt in het bundelaanzicht. De radiale zijdoorsnede toont de Y-hardware als een projectie loodrecht op het beeld, zonder oneigenlijke X-beweging |

## Aanzichten en schaal

- In de buis ligt de centroid op de lokale normaal van de referentiebaan. De zichtbare band is ±2σ, niet de vaste lijndikte van de centroid.
- De modelopening en getekende buisboring gebruiken dezelfde dwarse afbeeldingschaal. De versnellingsirissen laten diezelfde opening vrij.
- De targetdoorsnede vergroot R en T evenveel (viermaal de dwarse afbeeldingschaal van de buis) en vermeldt die vergroting. Dit is geen patiëntas- of millimeterkalibratie.
- In het MLC-/veldaanzicht hebben X en Y dezelfde schaal: een 10×10-veld is dus vierkant. De configuratierechthoek is een geometrische projectie, geen berekende fluence- of dosisverdeling.
- De veldgrootte is evenredig met de opgegeven afmeting, zonder een kunstmatige minimale offset. De veldrand wordt vanaf het downstream MLC-vlak naar het patiëntvlak geprojecteerd.
- Bij onderschepping stoppen het machinespoor, de envelop en de optiekgrafieken. Het target wordt dan als niet bereikt vermeld; er wordt geen extrapolatie als werkelijk aangekomen bundel getoond.
- Bij uitgeschakelde bron is een gedimde envelop/targetspot expliciet een optische voorspelling. Emissie-intensiteit en de berekende bundelvorm zijn verschillende grootheden.
- Meer focussterkte betekent niet noodzakelijk een smallere targetspot: de solenoïde-optiek kan een waist en vervolgens overfocus geven.

## Verificatie

Nieuwe model-/presentatietests controleren alle tien regelaars, causaliteit, tekenrichting, onafhankelijke veldassen, vierkante veldverhouding, de geometrische projectie naar het patiëntvlak, onveranderde optiek bij intensiteitswijziging en eindige coördinaten over de bereiken. De bestaande focuscausaliteitstest gebruikt nu de daadwerkelijke spoelintrede in plaats van de spoeluitgang.

Browsercontrole bedient elke regelaar op minimum, midden en maximum in fotonen-FF-, fotonen-FFF- en elektronenmodus (90 invoercombinaties). Aanvullend worden de zichtbare SVG-paden, envelop, T2-positie zonder valse R-beweging, intensiteit, X/Y-onafhankelijkheid, geparkeerde MLC, applicatoropening, toetsenbordstap van momentum, mobiele pagina-overloop en JavaScript-fouten gecontroleerd.

Moduswissels en reset blijven getest. De gewijzigde modulegrafiek krijgt in de HTML één expliciete versiekaart, zodat een eerder gecachete modelmodule geen onverenigbare mengversie veroorzaakt.
