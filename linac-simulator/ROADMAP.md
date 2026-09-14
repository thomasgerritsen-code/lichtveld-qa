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
| UI / educational readability | 4 | 4 | 4 | 4 | 4 | Priority |

## Golden path

Electron gun → RF / travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → Agility MLC / sculpted diaphragms → diverging field projection → isocentre / patient plane.

## Causality map

- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope compression → Focus 2 → downstream envelope compression.
- 1R/1T → primary injection centering; 2R/2T → downstream trajectory / target-angle alignment. Deliberate normalized mis-steering can produce wall interception / beam loss.
- Slalom M1 → initial energy-dispersive deflection → M2 counter-bend → M3 final achromatic redirection toward the treatment head. The displayed station sizes and gaps are normalized educational geometry.
- Photon mode → target → bremsstrahlung → FF/FFF section → monitor → Agility collimation → diverging field projection → patient-plane field/profile feedback.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → diverging field projection → patient plane, with separate normalized electron-scatter and photon-contamination teaching components.
- Field X/Y → MLC/diaphragm or electron-field aperture → projected field opening → visible patient-plane field width/height; steering/transport loss → beam-axis displacement and/or lower useful primary and patient-output proxy.

## Current evidence-backed improvement

The patient-plane section now includes a clearly labeled **head → isocentre side projection** in addition to the existing normalized top view. Public Elekta material supports the golden-path ordering from target/beam formation through beam shaping toward the patient, while peer-reviewed Agility literature explicitly depicts a central collimator axis and the different physical positions of MLC and diaphragms relative to the radiation source. The new side view therefore shows a source/beam-formation proxy, the relevant field-defining aperture, a diverging educational beam envelope and its intersection with the isocentre/patient plane. Field X changes both the normalized upstream aperture and downstream field width, while the existing transverse steering state displaces the projected beam-axis intersection. All head-to-isocentre distances, beam angles, aperture sizes and coordinates are deliberately normalized illustration geometry and are labeled **schematic / not to scale**; no Elekta SAD, proprietary head dimensions or service geometry are encoded.

## Recent evidence-backed improvements

- Electron mode depicts a dual scattering-foil topology: thin primary foil followed by a shaped secondary foil upstream of the monitor chamber, using normalized educational geometry only.
- Slalom graphics align three explicit normalized magnet stations with the same mechanical path used by the beam renderer, reducing geometry/renderer drift.
- Focus / steering graphics distinguish focusing hardware from two-axis steering hardware and make the different 1R/1T versus 2R/2T roles visible without changing beam physics.
- Patient-plane feedback makes FF/FFF shape, electron secondary components, field size, steering displacement and useful-output loss visible in one causal view sourced from the existing physics state.
- Head-to-isocentre projection now closes the visible spatial gap between treatment-head field definition and the patient plane without implying OEM distances.

## Next highest-value gap

All currently scored machine/beam subsystems are now at least 4/5 for geometry/topology and graphics/readability. The next audit should therefore rotate to **UI / educational readability** and inspect whether a user can follow the golden path without hunting across panels: selection/highlighting should make the active stage and its downstream consequence obvious on desktop and mobile. Prefer navigation/readability improvements that expose existing state over adding new physics controls.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

Prefer visualization readouts that consume existing physics/delivery state over re-implementing response curves in the UI. When public sources support topology but not OEM dimensions, encode the topology and causal relationships while making normalized illustration geometry explicit in both code comments and the visible UI. This run applies that rule by connecting head aperture, beam axis and isocentre spatially while labeling the projection as schematic and not to scale.
