# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 5 | 4 | 5 | 4 | 5 | In progress |
| Agility MLC / diaphragms | 5 | 4 | 5 | 4 | 5 | In progress |
| Electron gun / RF / waveguide | 5 | 4 | 5 | 4 | 5 | In progress |
| Focus / steering | 4 | 4 | 5 | 5 | 5 | In progress |
| Slalom bending / flight tube | 5 | 4 | 5 | 5 | 5 | In progress |
| Beam physics / patient-plane feedback | 4 | 4 | 4 | 5 | 5 | In progress |
| UI / educational readability | 4 | 4 | 5 | 5 | 5 | In progress |

## Golden path

Electron gun → RF feed / coupler → capture & bunching cells → travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → backscatter plate (photon head) → optical field system → Agility MLC / sculpted diaphragms or electron applicator → diverging field projection → isocentre / patient plane.

## Causality map

- Magnetron → RF feed waveguide → RF coupler → travelling-wave structure; entrance cells capture/bunch injected electrons before the main acceleration region. Coupler and region dimensions are normalized educational graphics.
- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope conditioning → 1R/1T primary injection centering / wall clearance → Focus 2 downstream envelope conditioning → 2R/2T downstream axis / target-angle alignment. Deliberate normalized mis-steering can produce wall interception / beam loss.
- 2R/2T → bend entry → M1 dispersive bend → M2 counter-bend → M3 final redirection → flight tube / treatment-head entrance. The continuity overlay reuses the renderer's mechanical geometry; displayed station sizes, gaps and path are normalized educational geometry.
- Photon mode → target → bremsstrahlung → FF/FFF section → monitor → backscatter plate → optical field system → Agility collimation → diverging field projection → patient-plane field/profile feedback.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → diverging field projection → patient plane, with separate normalized electron-scatter and photon-contamination teaching components.
- Field X/Y → MLC/diaphragm or electron-field aperture → projected field opening → visible patient-plane field width/height; steering/transport loss → beam-axis displacement and/or lower useful primary and patient-output proxy.

## Current evidence-backed improvement

The slalom / flight-tube section now closes the visual transport gap from secondary steering into the bending assembly and treatment-head entrance. Public medical-LINAC descriptions support an achromatic multi-magnet bending system between the accelerating structure and treatment head. The simulator already contained normalized M1/M2/M3 geometry and bend-state physics; this change adds an explicit **2R/2T → bend entry → M1 → M2 → M3 → flight tube / head entrance** continuity overlay sourced from the same `buildMechanicalGeometry()` path used by the renderer.

The overlay is visualization-only. It introduces no bend currents, magnetic fields, bend angles, energy-selection thresholds, dimensions or service calibration values.

## Recent evidence-backed improvements

- Electron mode depicts a dual scattering-foil topology upstream of the monitor chamber using normalized educational geometry only.
- Focus / steering graphics expose the envelope → centering/wall-clearance → downstream-alignment causal chain.
- Patient-plane feedback makes FF/FFF shape, electron secondary components, field size, steering displacement and useful-output loss visible in one causal view sourced from existing physics state.
- Head-to-isocentre projection closes the visible spatial gap between treatment-head field definition and the patient plane without implying OEM distances.
- Golden-path navigation links the full machine chain into one selectable, mode-aware educational sequence on desktop and mobile.
- Photon-head topology includes the monitor backscatter plate between chamber and field-light mirror.
- Source/RF graphics expose RF feed → coupler → capture/bunching → main travelling-wave acceleration as distinct educational stages.
- Agility graphics expose 80 leaves per bank, eccentric rounded tips, integrated dynamic leaf guides and the orthogonal sculpted diaphragm pair as separate source-supported roles.

## Next highest-value gap

Rotate to **Photon/Electron beam-path mode switching** next. Audit the visible continuity from bend/head entrance through **target or electron window → FF/FFF or scattering foils → monitor stack**, and prefer a mode-dependent topology/cause-effect gap over cosmetic detail. In particular, public evidence supports FF versus FFF filtration differences and dual scattering-foil electron transport; the simulator should make those mutually exclusive active routes immediately legible without inventing OEM dimensions or service settings. If no meaningful public-evidence-backed improvement exists, leave main unchanged and rotate again.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

When two individually credible subsystems meet, explicitly audit the **handoff boundary** using the same geometry/state source as both renderers. A missing visual handoff can break the educational golden path even when neither subsystem is locally wrong; fix that shared boundary before adding a new control or duplicate response model.
