# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 5 | 4 | 5 | 5 | 5 | In progress |
| Agility MLC / diaphragms | 5 | 4 | 5 | 5 | 5 | In progress |
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
- Photon mode → target → bremsstrahlung → FF inserted or FFF open filter position → monitor → backscatter plate → optical field system → Agility collimation → diverging field projection → patient-plane field/profile feedback.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → diverging field projection → patient plane, with separate normalized electron-scatter and photon-contamination teaching components.
- Photon Field X → Agility MLC bank opening along the leaf-travel axis; Photon Field Y → the orthogonal sculpted diaphragm pair. Both then feed the existing projected field opening / patient-plane footprint. Electron mode does not present this photon-collimation overlay.
- Steering/transport loss → beam-axis displacement and/or lower useful primary and patient-output proxy.

## Current evidence-backed improvement

Agility field-size cause-effect now exposes the distinct roles already present in the renderer: **Field X → Agility MLC banks** and **Field Y → orthogonal sculpted diaphragms**. Public Agility descriptions and peer-reviewed head models support 160 leaves in two banks, leaf travel along one IEC axis, and a separate sculpted diaphragm pair defining the orthogonal axis with no backup jaws. The overlay is driven by existing `fx`/`fy`, active-control and photon/electron state; it adds no new control or collimation physics.

The axis guides are normalized educational graphics only. No leaf speeds, travel limits, minimum gaps, mechanical dimensions, tolerances or service/calibration values are used. In Electron mode the photon Agility cause-effect overlay is hidden so it does not imply that photon MLC/diaphragm field definition is the active electron route.

## Recent evidence-backed improvements

- Treatment-head entrance exposes mutually exclusive Photon FF, Photon FFF and Electron routes from existing mode/filter state.
- Slalom / flight-tube continuity exposes 2R/2T → bend entry → M1 → M2 → M3 → flight tube / head entrance from shared renderer geometry.
- Electron mode depicts a dual scattering-foil topology upstream of the monitor chamber using normalized educational geometry only.
- Focus / steering graphics expose the envelope → centering/wall-clearance → downstream-alignment causal chain.
- Patient-plane feedback makes FF/FFF shape, electron secondary components, field size, steering displacement and useful-output loss visible in one causal view sourced from existing physics state.
- Head-to-isocentre projection closes the visible spatial gap between treatment-head field definition and the patient plane without implying OEM distances.
- Golden-path navigation links the full machine chain into one selectable, mode-aware educational sequence on desktop and mobile.
- Photon-head topology includes the monitor backscatter plate between chamber and field-light mirror.
- Source/RF graphics expose RF feed → coupler → capture/bunching → main travelling-wave acceleration as distinct educational stages.
- Agility graphics expose 80 leaves per bank, eccentric rounded tips, integrated dynamic leaf guides and the orthogonal sculpted diaphragm pair as separate source-supported roles.

## Next highest-value gap

Rotate to **electron gun / RF / waveguide cause-effect** next. Geometry/readability and regression coverage are strong, but educational interaction remains 4/5. Audit whether the existing magnetron power/tune, RF phase and gun controls visibly distinguish source/capture effects from downstream acceleration response without inventing RF frequency, phase calibration, service thresholds or proprietary waveguide dimensions. If already sufficiently clear, rotate to beam-physics/patient-plane graphics rather than polishing DONE geometry.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

For controls that already drive correct physics, audit whether the responsible hardware axis is immediately identifiable in the machine view before adding another control or response model. Prefer a state-derived cause-effect overlay that disappears when that hardware route is inactive; this keeps educational UI coupled to existing machine state and avoids duplicating physics.
