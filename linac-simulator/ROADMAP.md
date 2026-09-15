# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 5 | 4 | 5 | 4 | 5 | In progress |
| Agility MLC / diaphragms | 5 | 4 | 5 | 4 | 5 | In progress |
| Electron gun / RF / waveguide | 5 | 4 | 5 | 4 | 5 | In progress |
| Focus / steering | 4 | 4 | 5 | 5 | 5 | In progress |
| Slalom bending / flight tube | 4 | 4 | 4 | 4 | 5 | Priority |
| Beam physics / patient-plane feedback | 4 | 4 | 4 | 5 | 5 | In progress |
| UI / educational readability | 4 | 4 | 5 | 5 | 5 | In progress |

## Golden path

Electron gun → RF feed / coupler → capture & bunching cells → travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → backscatter plate (photon head) → optical field system → Agility MLC / sculpted diaphragms or electron applicator → diverging field projection → isocentre / patient plane.

## Causality map

- Magnetron → RF feed waveguide → RF coupler → travelling-wave structure; entrance cells capture/bunch injected electrons before the main acceleration region. Coupler and region dimensions are normalized educational graphics.
- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope conditioning → 1R/1T primary injection centering / wall clearance → Focus 2 downstream envelope conditioning → 2R/2T downstream axis / target-angle alignment. Deliberate normalized mis-steering can produce wall interception / beam loss.
- Slalom M1 → initial energy-dispersive deflection → M2 counter-bend → M3 final achromatic redirection toward the treatment head. The displayed station sizes and gaps are normalized educational geometry.
- Photon mode → target → bremsstrahlung → FF/FFF section → monitor → backscatter plate → optical field system → Agility collimation → diverging field projection → patient-plane field/profile feedback.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → diverging field projection → patient plane, with separate normalized electron-scatter and photon-contamination teaching components.
- Field X/Y → MLC/diaphragm or electron-field aperture → projected field opening → visible patient-plane field width/height; steering/transport loss → beam-axis displacement and/or lower useful primary and patient-output proxy.

## Current evidence-backed improvement

The Focus / steering section now makes the source-supported functional chain visible directly above the waveguide: **Focus 1 envelope conditioning → 1R/1T injection centering and wall clearance → Focus 2 downstream envelope conditioning → 2R/2T downstream axis / target alignment**. Public Elekta SL25 literature explicitly distinguishes the two focus-coil sets, primary steering that centers the injected beam, and secondary steering that aligns the electron beam to the target at the correct angle. The existing beam renderer already visualizes centroid displacement, envelope and wall interception; this run connects those existing effects to the hardware stages instead of introducing another physics model.

The arrows, labels and effect metadata are normalized educational annotations only. No coil currents, magnetic fields, servo gains, LUT values, thresholds, dimensions or service geometry are added.

## Recent evidence-backed improvements

- Electron mode depicts a dual scattering-foil topology: thin primary foil followed by a shaped secondary foil upstream of the monitor chamber, using normalized educational geometry only.
- Slalom graphics align three explicit normalized magnet stations with the same mechanical path used by the beam renderer, reducing geometry/renderer drift.
- Focus / steering graphics distinguish focusing hardware from two-axis steering hardware and now expose the envelope → centering/wall-clearance → downstream-alignment causal chain.
- Patient-plane feedback makes FF/FFF shape, electron secondary components, field size, steering displacement and useful-output loss visible in one causal view sourced from the existing physics state.
- Head-to-isocentre projection closes the visible spatial gap between treatment-head field definition and the patient plane without implying OEM distances.
- Golden-path navigation links the full machine chain into one selectable, mode-aware educational sequence on desktop and mobile.
- Photon-head topology explicitly includes the source-supported monitor backscatter plate between the chamber and field-light mirror.
- Source/RF graphics expose RF feed → coupler → capture/bunching → main travelling-wave acceleration as distinct educational stages.
- Agility graphics expose 80 leaves per bank, eccentric rounded tips, integrated dynamic leaf guides and the orthogonal sculpted diaphragm pair as separate source-supported roles.

## Next highest-value gap

Focus / steering now has strong graphics, cause-effect readability and regression coverage while its geometry and physics remain intentionally normalized. Rotate to **slalom bending / flight tube** next: audit the continuity from secondary steering into bend entry, M1/M2/M3 and the flight-tube/head entrance, prioritizing a source-supported connection or educational cause-effect gap over cosmetic detail. If no meaningful public-evidence-backed improvement exists, leave main unchanged and rotate again.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

When a subsystem already has the correct normalized behavior, prefer **linking existing rendered consequences back to the responsible hardware stage** over adding a new control or duplicate response model. A causal annotation should name only source-supported roles and reuse the same geometry anchors/state used by the beam renderer; service currents, thresholds and calibration behavior remain out of scope.