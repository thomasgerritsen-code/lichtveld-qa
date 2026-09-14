# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 4 | 4 | 4 | 4 | 4 | In progress |
| Agility MLC / diaphragms | 4 | 4 | 4 | 4 | 5 | In progress |
| Electron gun / RF / waveguide | 4 | 4 | 4 | 4 | 4 | In progress |
| Focus / steering | 4 | 4 | 4 | 4 | 5 | In progress |
| Slalom bending / flight tube | 4 | 4 | 4 | 4 | 5 | In progress |
| Beam physics / patient-plane feedback | 3 | 4 | 4 | 5 | 5 | Priority |
| UI / educational readability | 4 | 4 | 4 | 4 | 4 | In progress |

## Golden path

Electron gun → RF / travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → Agility MLC / sculpted diaphragms → patient plane.

## Causality map

- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope compression → Focus 2 → downstream envelope compression.
- 1R/1T → primary injection centering; 2R/2T → downstream trajectory / target-angle alignment. Deliberate normalized mis-steering can produce wall interception / beam loss.
- Slalom M1 → initial energy-dispersive deflection → M2 counter-bend → M3 final achromatic redirection toward the treatment head. The displayed station sizes and gaps are normalized educational geometry.
- Photon mode → target → bremsstrahlung → FF/FFF section → monitor → Agility collimation → patient-plane field/profile feedback.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → patient plane, with separate normalized electron-scatter and photon-contamination teaching components.
- Field X/Y → MLC/diaphragm aperture → visible patient-plane field width/height; steering/transport loss → lower useful primary and patient-output proxy.

## Current evidence-backed improvement

The simulator now combines the already modeled treatment-beam effects into a dedicated **patient-plane cause → effect** view. Photon FF is shown qualitatively as a flatter central profile, while FFF is visibly central-peaked and retains the existing lower normalized head-scatter ordering. Electron mode exposes the existing applicator/head-scatter proxy and its smaller photon-contamination component separately. Field X/Y directly changes the displayed field footprint; R/T steering moves the beam centre; transport/target loss lowers useful-primary and patient-output readouts. Relative edge width is measured from the existing detector profiles instead of creating a second penumbra model. All intensities, edge widths and scatter quantities remain normalized educational values rather than clinical dose, commissioning or acceptance data.

## Recent evidence-backed improvements

- Electron mode depicts a dual scattering-foil topology: thin primary foil followed by a shaped secondary foil upstream of the monitor chamber, using normalized educational geometry only.
- Slalom graphics align three explicit normalized magnet stations with the same mechanical path used by the beam renderer, reducing geometry/renderer drift.
- Focus / steering graphics distinguish focusing hardware from two-axis steering hardware and make the different 1R/1T versus 2R/2T roles visible without changing beam physics.
- Patient-plane feedback now makes FF/FFF shape, electron secondary components, field size, steering displacement and useful-output loss visible in one causal view sourced from the existing physics state.

## Next highest-value gap

Patient-plane feedback is much clearer, but its **geometry/topology score remains 3/5** because the current panel is a normalized top-view abstraction rather than a source-backed spatial continuation of the treatment-head exit toward isocentre. A future audit should decide whether adding a clearly schematic head-to-isocentre projection/light-field relationship would materially improve the golden path without implying proprietary treatment-head dimensions. If not, rotate to treatment-head/beam-path or electron-gun/RF geometry rather than cosmetically polishing this panel.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

Prefer visualization readouts that consume existing physics/delivery state over re-implementing response curves in the UI. This run derives patient-plane field shape, steering centre, useful-primary level, output proxy, scatter components and relative edge width from the existing detector/radiation/delivery models. That keeps the Machine Geometry → Physics → Visualization separation auditable and prevents UI-only physics drift.
