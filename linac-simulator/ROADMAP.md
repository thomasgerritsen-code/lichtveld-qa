# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 5 | 4 | 5 | 5 | 5 | In progress |
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
- Photon mode → target → bremsstrahlung → FF inserted or FFF open filter position → monitor → backscatter plate → optical field system → Agility collimation → diverging field projection → patient-plane field/profile feedback.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → diverging field projection → patient plane, with separate normalized electron-scatter and photon-contamination teaching components.
- Field X/Y → MLC/diaphragm or electron-field aperture → projected field opening → visible patient-plane field width/height; steering/transport loss → beam-axis displacement and/or lower useful primary and patient-output proxy.

## Current evidence-backed improvement

The treatment-head entrance now exposes a single mode-aware route overlay sourced from machine mode/filter state. Photon FF shows **head entrance → target / bremsstrahlung → flattening filter in → monitor**; Photon FFF keeps the target route but explicitly shows the flattening-filter position as out/open; Electron shows **head entrance → electron window → primary + shaped secondary scattering foils → monitor**. The inactive alternative is not presented as part of the active causal route.

This is visualization/state topology only. It reuses the existing target, window, filter, foil and monitor hardware and does not introduce new dose physics, target dimensions, foil thicknesses, filter dimensions, carousel positions, thresholds or service/calibration values.

## Recent evidence-backed improvements

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

Rotate to **Agility MLC / sculpted diaphragms cause-effect** next. Geometry/readability and regression coverage are strong, but the scorecard still shows 4/5 for educational interaction. Audit whether existing field X/Y controls make the distinct MLC-bank versus orthogonal sculpted-diaphragm roles immediately visible and testable without adding a new control or inventing OEM motion limits. If that is already sufficiently clear, rotate to electron gun/RF cause-effect or beam-physics/patient-plane graphics rather than polishing DONE geometry.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

For mode-switching hardware, audit the route as a mutually exclusive state graph as well as a component-order checklist: each active route must name its shared downstream handoff, and inactive alternatives must not look simultaneously active. This prevents a correct set of individual components from teaching an ambiguous machine topology.
