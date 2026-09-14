# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 4 | 4 | 4 | 4 | 4 | In progress |
| Agility MLC / diaphragms | 4 | 4 | 4 | 4 | 5 | In progress |
| Electron gun / RF / waveguide | 4 | 4 | 4 | 4 | 4 | In progress |
| Focus / steering | 4 | 4 | 4 | 4 | 5 | In progress |
| Slalom bending / flight tube | 4 | 4 | 4 | 4 | 5 | In progress |
| Beam physics / patient-plane feedback | 4 | 4 | 4 | 5 | 5 | In progress |
| UI / educational readability | 4 | 4 | 5 | 5 | 5 | In progress |

## Golden path

Electron gun → RF / travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → Agility MLC / sculpted diaphragms or electron applicator → diverging field projection → isocentre / patient plane.

## Causality map

- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope compression → Focus 2 → downstream envelope compression.
- 1R/1T → primary injection centering; 2R/2T → downstream trajectory / target-angle alignment. Deliberate normalized mis-steering can produce wall interception / beam loss.
- Slalom M1 → initial energy-dispersive deflection → M2 counter-bend → M3 final achromatic redirection toward the treatment head. The displayed station sizes and gaps are normalized educational geometry.
- Photon mode → target → bremsstrahlung → FF/FFF section → monitor → Agility collimation → diverging field projection → patient-plane field/profile feedback.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → diverging field projection → patient plane, with separate normalized electron-scatter and photon-contamination teaching components.
- Field X/Y → MLC/diaphragm or electron-field aperture → projected field opening → visible patient-plane field width/height; steering/transport loss → beam-axis displacement and/or lower useful primary and patient-output proxy.

## Current evidence-backed improvement

The simulator now exposes the complete source-supported topology as a **mode-aware golden-path navigator**. The navigator follows the same educational chain already represented by the machine model and makes the selected stage plus its downstream hardware visually obvious instead of requiring the user to hunt across panels. Photon mode explicitly presents target → FF/FFF → monitoring → Agility/diaphragms, while Electron mode presents electron window/scattering → monitoring → applicator. Selecting a step highlights the corresponding existing SVG components and reuses the existing component-information interaction; it does not add or duplicate beam physics. On narrow screens the steps form a touch-sized horizontally scrollable sequence with previous/next controls, preserving the mobile detail viewer introduced earlier.

Public Elekta Versa HD material supports the treatment-level ordering of beam generation/shaping and Agility beam shaping, while standard public radiotherapy teaching supports the general accelerator → bending → beam-production → monitoring/collimation → patient chain. The navigator encodes only that public topology and the simulator's already normalized educational causal descriptions; it adds no OEM service values, proprietary geometry or clinical settings.

## Recent evidence-backed improvements

- Electron mode depicts a dual scattering-foil topology: thin primary foil followed by a shaped secondary foil upstream of the monitor chamber, using normalized educational geometry only.
- Slalom graphics align three explicit normalized magnet stations with the same mechanical path used by the beam renderer, reducing geometry/renderer drift.
- Focus / steering graphics distinguish focusing hardware from two-axis steering hardware and make the different 1R/1T versus 2R/2T roles visible without changing beam physics.
- Patient-plane feedback makes FF/FFF shape, electron secondary components, field size, steering displacement and useful-output loss visible in one causal view sourced from the existing physics state.
- Head-to-isocentre projection closes the visible spatial gap between treatment-head field definition and the patient plane without implying OEM distances.
- Golden-path navigation now links the full machine chain into one selectable, mode-aware educational sequence on desktop and mobile.

## Next highest-value gap

UI / educational readability is no longer the lowest-scoring subsystem. The next audit should rotate back to the configured technical priority order and look for a source-supported 4/5 → 5/5 improvement in **treatment head / beam path** or **electron gun / RF / waveguide** before adding more UI polish. Prefer a change that improves topology, causal clarity and regression coverage together; if no clear public-source-supported gap exists, leave main unchanged.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

Prefer navigation and explanatory UI that references the same component identifiers and existing application state already used by the machine renderer. This keeps educational guidance synchronized with the modeled topology and avoids a parallel 'documentation-only' machine model that could drift from the simulator itself.
