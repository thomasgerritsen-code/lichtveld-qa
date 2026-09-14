# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 4 | 4 | 4 | 4 | 4 | In progress |
| Agility MLC / diaphragms | 4 | 4 | 4 | 4 | 5 | In progress |
| Electron gun / RF / waveguide | 4 | 4 | 4 | 4 | 4 | In progress |
| Focus / steering | 4 | 4 | 3 | 4 | 4 | Priority |
| Slalom bending / flight tube | 4 | 4 | 4 | 4 | 5 | In progress |
| Beam physics / patient-plane feedback | 3 | 4 | 3 | 4 | 4 | In progress |
| UI / educational readability | 4 | 4 | 4 | 4 | 4 | In progress |

## Golden path

Electron gun → RF / travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → Agility MLC / sculpted diaphragms → patient plane.

## Causality map

- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope compression → Focus 2 → downstream envelope compression.
- 1R/1T and 2R/2T → trajectory correction → possible wall interception / beam loss when deliberately mis-steered.
- Slalom M1 → initial energy-dispersive deflection → M2 counter-bend → M3 final achromatic redirection toward the treatment head. The displayed station sizes and gaps are normalized educational geometry.
- Photon mode → target → bremsstrahlung → FF/FFF section → monitor → Agility collimation.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → patient plane.

## Current evidence-backed improvement

The slalom bending assembly now exposes a source-supported **three-stage magnet topology** directly around the modeled flight-tube path: M1 as the first dispersive bend, M2 as the opposing/counter bend and a visually larger M3 station for the final achromatic redirection toward the treatment head. The previous broad polygons remain only as a subdued assembly envelope. Public Elekta teaching describes magnets in the flight tube producing the compact slalom bend; IAEA/AAPM teaching diagrams show the sequential three-bend topology. All displayed pole sizes, gaps and relative drawing lengths are normalized educational values; no OEM pole dimensions, field strengths, currents or service geometry are represented.

## Recent evidence-backed improvements

- Electron mode depicts a dual scattering-foil topology: thin primary foil followed by a shaped secondary foil upstream of the monitor chamber, using normalized educational geometry only.
- Slalom graphics now align three explicit normalized magnet stations with the same mechanical path used by the beam renderer, reducing disagreement between geometry and visualization.

## Next highest-value gap

Focus / steering remains the next high-value visual gap: the causal behavior and stage order are already modeled, but the magnet graphics should be checked against public accelerator diagrams so that Focus 1/2 and 1R/1T / 2R/2T are easier to distinguish physically without implying proprietary coil dimensions or service settings. Beam-physics / patient-plane feedback remains a parallel lower-scoring area but follows later in the configured priority order.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

A graphics change should preferentially derive display stations from the same geometry object used by beam transport rather than duplicating SVG coordinates. This reduces geometry/renderer drift while preserving the separation between machine topology, educational physics and presentation.
