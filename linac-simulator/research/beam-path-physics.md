# Bundelweg en componentinvloeden — vervolgonderzoek 5 november 2026

## Bronnen en toepassingsgrenzen

- [Waldron, AAPM 2002, pp. 5 en 7–9](https://www.aapm.org/meetings/02Am/pdf/8280-44071.pdf): SL25 heeft een magnetrongevoede travelling-wave structuur en een diode-injector zonder rooster. Drie buigsectoren selecteren het transport naar target/venster. De eerdere bronbeschrijving met rooster was daarom onjuist en is gecorrigeerd.
- [Anderson et al., JACMP 2015](https://aapm.onlinelibrary.wiley.com/doi/full/10.1120/jacmp.v16i3.5139), §§I.A–I.C en resultaatbeschrijving: een onderwijsmodel kan energieopbouw, beam loading en bijpassend buigveld verklaren. Meer bundelstroom kan energie aan de RF-golf onttrekken. Afstemming van energie en magneetveld bepaalt welk deel de target bereikt. De gepubliceerde simulatie gebruikt hoofdzakelijk een klystronopstelling; haar stroom-, spannings- en vermogenskalibraties worden niet op de SL25 overgezet.
- [Latina, CERN/JUAS, Transverse Beam Dynamics](https://indico.cern.ch/event/779575/contributions/3244658/attachments/1778064/2898322/Lectures.pdf), geïndexeerde solenoïdematrix en definitie K=B/(2Bρ): ondersteunt gekoppelde focusering/rotatie en momentumafhankelijke sterkte. [CERN/JUAS Particle Optics](https://indico.cern.ch/event/976482/contributions/4112494/attachments/2169835/3663716/ParticleOptics_juas2021_NB.pdf) beschrijft de spectrometerwerking van sectorbuigingen. De directe PDF-ophaalpogingen werden met HTTP 403 geblokkeerd; de geïndexeerde bronfragmenten waren beschikbaar. De matriximplementatie is aanvullend algebraïsch/numeriek getoetst, niet aan een gemeten Elekta-magneet.
- [Pitcher et al., JACMP 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC5874087/): een primaire folie verbreedt de elektronenbundel; de gevormde secundaire folie maakt het profiel vlakker. Jaws, applicator en insert begrenzen het veld en kunnen verstrooiing/lekkage veroorzaken. Het relevante openbare bronfragment ondersteunt de volgorde en functie, maar levert hier geen volledige verstrooiingsparameterset.
- [Georg et al., Medical Physics 2011](https://aapm.onlinelibrary.wiley.com/doi/10.1118/1.3554643): FF/FFF verschilt in downstream filtering en bundelvorm. Verwijdering van de flattening filter is geen stuurspoel vóór de target. De nieuwe vormfiguur toont daarom alleen een canoniek vlak versus centraal gepiekt principe, geen gecommissioneerd profiel.

## Van onderzoek naar simulatie

| Bundelweg / component | Fysisch principe | Toepassing |
|---|---|---|
| Kathode → anode | Elektronenbron, bij de SL25 een diode | Bronbeschrijving gecorrigeerd; emissie blijft een relatieve instelling bij vast uitgangsmomentum |
| Modulator / RF-bron → versnellingsbuis | RF levert energie; stroom kan beam loading veroorzaken | Uitleg van gekoppelde grootheden toegevoegd. Geen fictieve RF-vermogensknop met onbewezen machinekalibratie |
| Focus 1/2 | Solenoïde: focusering, rotatie en momentumafhankelijkheid | Bestaande gekoppelde matrix behouden; chromatische centroidgevoeligheid wordt in de dispersie meegenomen |
| 1R/1T en 2R/2T | Lokale momentumafhankelijke hoekkick | Ook de eerste-orde energiederivaat van de kick wordt getransporteerd |
| M1 → M2 → M3 | Lorentzbuiging met magnetische rigiditeit Bρ=p/q | Nieuwe regelaar `Buigveld B`, onafhankelijk van momentum. Afwijking wordt over de sectoren opgebouwd. Bij B/p=1 is de centrale referentiebaan hersteld |
| Momentumspeiding | Verschillende momenta hebben verschillende banen | Nieuwe regelaar σp/p in procent. De eerste-orde gevoeligheidsvector D wordt getransporteerd en getoond met ±1σp-lijnen |
| Target → FF/FFF | Remstraling en downstream profielvorming | Bestaande targetroute behouden; extra expliciet kwalitatieve vormfiguur en bronuitleg |
| Venster → primaire folie → secundaire folie | Eerst verbreden, vervolgens profielvormen | Het getekende elektronenlint blijft smal tot de eerste folie en verbreedt erna. De breedte is een illustratie gekoppeld aan de veldinstelling, geen Monte-Carlo-verstrooiingsberekening |
| MLC / diafragma / applicator | Veldbegrenzing | Onafhankelijke geometrische X/Y-projectie behouden, met passende modusafhankelijke hardware |
| Monitor | Onafhankelijke monitoring, geen focuselement | Beschrijving blijft onderscheiden van de upstream optiek; geen ongefundeerde dose-feedback toegevoegd |

## Wiskunde van de toevoegingen

Binnen de eerste-orde referentieoptiek wordt de krommingsafwijking aangestuurd door `bendStrength / momentum - 1`. De centrale baan kan met het gemeenschappelijke hoofdveld worden teruggebracht, zonder dat momentum en magneetveld dezelfde grootheid worden. Focus blijft bij een ander momentum anders werken, ook wanneer de baan door de buigsectie hersteld is.

De dispersievector is de afgeleide van de centroidtoestand naar de relatieve momentumafwijking. Drifts en magneten transporteren die vector met dezelfde matrix. Steering voegt de afgeleide van zijn 1/p-kick toe. De solenoïdebijdrage aan de chromatische centroid wordt centraal gedifferentieerd met een kleine relatieve momentumstap. Dit berekent geen volledige chromatische vervorming van de intrinsieke verdeling.

Voor een symmetrische, ongecorreleerde momentumverdeling wordt de ruimtelijke/hoekcovariantie aangevuld met `D Dᵀ σδ²`. Een grotere spreiding verandert daardoor de totale envelop, zonder de gemiddelde baan kunstmatig te verschuiven. De twee dispersielijnen vertegenwoordigen alleen de lineaire ±1σδ-centroids, niet de volledige deeltjesverdeling.

## Bewust niet geclaimd

Geen OEM-veldsterktes, gunstromen, RF-calibraties, MeV-instellingen, exacte randvelden of achromatische commissioning. De eenvoudige slalom kan restdispersie vertonen; er wordt geen perfecte achromaat gesuggereerd. Bronsterkte bij vast momentum is niet hetzelfde als een echte gun-current-scan bij onveranderd RF-vermogen. Het bestaande tweesigma-apertuurcriterium blijft een educatieve onderscheppingsgrens en beschrijft geen geleidelijke verliezen van Gaussische staarten.

De vormfiguur van FF/FFF/elektronen is geïdealiseerd. Energieafhankelijke dose-profielen, multiple scattering, applicator-wall scatter, penumbra en absolute output vragen aanvullend materiaaltransport en metingen. De expliciete uitleg op de pagina voorkomt dat deze illustraties als berekende dosimetrie worden gelezen.

## Verificatie

Numerieke tests vergelijken de dispersie met eindige verschillen van het hele transport, ook voor een gestuurde bundel; controleren B/p-afstemming, additieve positieve covariantie, onveranderde centroid bij symmetrische spreiding, juiste folievolgorde en upstream onafhankelijkheid van FF/FFF. Alle bestaande model- en sliderchecks blijven vereist.

Eindresultaat: 207 Node-tests geslaagd. Browsercontrole: twaalf schuifregelaars × minimum/midden/maximum × fotonen-FF/fotonen-FFF/elektronen = 108 combinaties, plus B/p-herstel, dispersielijnen, FF/FFF-vormfiguur, toetsenbordprecisie en desktop/mobiel. Geen JavaScript-fouten of horizontale pagina-overloop.
