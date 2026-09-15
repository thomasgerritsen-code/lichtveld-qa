# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 5 | 4 | 5 | 4 | 5 | In progress |
| Agility MLC / diaphragms | 4 | 4 | 4 | 4 | 5 | Priority |
| Electron gun / RF / waveguide | 5 | 4 | 5 | 4 | 5 | In progress |
| Focus / steering | 4 | 4 | 4 | 4 | 5 | In progress |
| Slalom bending / flight tube | 4 | 4 | 4 | 4 | 5 | In progress |
| Beam physics / patient-plane feedback | 4 | 4 | 4 | 5 | 5 | In progress |
| UI / educational readability | 4 | 4 | 5 | 5 | 5 | In progress |

## Golden path

Electron gun → RF feed / coupler → capture & bunching cells → travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → backscatter plate (photon head) → optical field system → Agility MLC / sculpted diaphragms or electron applicator → diverging field projection → isocentre / patient plane.

## Causality map

- Magnetron → RF feed waveguide → RF coupler → travelling-wave structure; entrance cells capture/bunch injected electrons before the main acceleration region. Coupler and region dimensions are normalized educational graphics.
- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope compression → Focus 2 → downstream envelope compression.
- 1R/1T → primary injection centering; 2R/2T → downstream trajectory / target-angle alignment. Deliberate normalized mis-steering can produce wall interception / beam loss.
- Slalom M1 → initial energy-dispersive deflection → M2 counter-bend → M3 final achromatic redirection toward the treatment head. The displayed station sizes and gaps are normalized educational geometry.
- Photon mode → target → bremsstrahlung → FF/FFF section → monitor → backscatter plate → optical field system → Agility collimation → diverging field projection → patient-plane field/profile feedback.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → diverging field projection → patient plane, with separate normalized electron-scatter and photon-contamination teaching components.
- Field X/Y → MLC/diaphragm or electron-field aperture → projected field opening → visible patient-plane field width/height; steering/transport loss → beam-axis displacement and/or lower useful primary and patient-output proxy.

## Current evidence-backed improvement

The source/RF section now explicitly shows the previously implicit **RF coupler** where the existing magnetron feed meets the accelerating structure, and distinguishes the entrance **capture / bunching region** from the downstream **main acceleration region**. Public Elekta-oriented diagrams identify the magnetron, RF coupler, demountable electron gun and S-band travelling-wave accelerating structure as separate functional elements. General accelerator references describe the early travelling-wave cells as the region where injected electrons are captured into RF bunches and brought rapidly toward relativistic velocity before the downstream cells mainly continue energy gain.

The change is deliberately topological and educational: it annotates the existing RF feed and cell progression rather than adding frequencies, powers, phases, cell lengths, iris dimensions or OEM service values. Existing normalized RF/capture physics remains the single behavior model.

## Recent evidence-backed improvements

- Electron mode depicts a dual scattering-foil topology: thin primary foil followed by a shaped secondary foil upstream of the monitor chamber, using normalized educational geometry only.
- Slalom graphics align three explicit normalized magnet stations with the same mechanical path used by the beam renderer, reducing geometry/renderer drift.
- Focus / steering graphics distinguish focusing hardware from two-axis steering hardware and make the different 1R/1T versus 2R/2T roles visible without changing beam physics.
- Patient-plane feedback makes FF/FFF shape, electron secondary components, field size, steering displacement and useful-output loss visible in one causal view sourced from the existing physics state.
- Head-to-isocentre projection closes the visible spatial gap between treatment-head field definition and the patient plane without implying OEM distances.
- Golden-path navigation links the full machine chain into one selectable, mode-aware educational sequence on desktop and mobile.
- Photon-head topology explicitly includes the source-supported monitor backscatter plate between the chamber and field-light mirror.
- Source/RF graphics now expose RF feed → coupler → capture/bunching → main travelling-wave acceleration as distinct educational stages.

## Next highest-value gap

Electron gun / RF / waveguide now meets the current source-supported 5/5 threshold for topology, graphics and regression coverage; physics and interaction remain 4/5 because the existing normalized RF response is intentionally not replaced with machine-specific values. Rotate to **Agility MLC / sculpted diaphragms** next and audit whether public evidence supports a concrete topology, leaf-bank/rounded-end, diaphragm-role or mode-dependent readability improvement. If not, leave main unchanged rather than adding cosmetic detail.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

When a subsystem already contains a causal model but its hardware path is visually implicit, prefer exposing source-supported intermediate topology (for example a coupler or capture region) by annotating the existing geometry/state. Do not create a second physics model merely to justify a visual improvement, and do not infer OEM dimensions or service parameters from schematic drawings.
