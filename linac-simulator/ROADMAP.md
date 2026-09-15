# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

## Visual fidelity override
The working animation/physics layers are protected while the machine drawing is rebuilt toward a mechanically coherent, source-backed educational cutaway. **Component visual fidelity has priority over new overlays, labels, controls or animation features.** A change must not be merged when it makes the hardware depiction less credible even if its causal animation is useful.

| Subsystem | Geometry / topology | Physics / behavior | Component visual fidelity | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 5 | 4 | 4 | 5 | 5 | 5 | Visual rebuild |
| Agility MLC / diaphragms | 5 | 4 | 3 | 5 | 5 | 5 | Visual rebuild |
| Electron gun / RF / waveguide | 5 | 4 | 4 | 5 | 4 | 5 | Visual rebuild |
| Focus / steering | 4 | 4 | 4 | 5 | 5 | 5 | Visual rebuild |
| Slalom bending / flight tube | 5 | 4 | 4 | 5 | 5 | 5 | Visual rebuild |
| Beam physics / patient-plane feedback | 4 | 4 | n/a | 4 | 5 | 5 | Protected |
| UI / educational readability | 4 | 4 | n/a | 5 | 5 | 5 | Protected |

## Golden path
Electron gun → RF feed / coupler → capture & bunching cells → travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → backscatter plate → optical field system → Agility MLC / sculpted diaphragms or electron applicator → patient plane.

## Causality map
- Magnetron → RF feed → RF coupler → travelling-wave structure → normalized accelerator response.
- Focus 1 → envelope → 1R/1T centering/wall clearance → Focus 2 → 2R/2T downstream alignment.
- 2R/2T → bend entry → M1 → M2 → M3 → flight tube / treatment-head entrance.
- Photon → target → bremsstrahlung → FF/FFF → monitor → Agility → patient plane.
- Electron → exit window → scattering foils → monitor → applicator → patient plane.

## Current evidence-backed improvement
IAEA public teaching material places the x-ray target, primary collimator, flattening-filter system, ion chamber and downstream collimation within the treatment-head chain. Elekta public Versa HD material confirms the Versa HD/Agility platform and FF/FFF high-dose-rate operation. The simulator already models those internals and mode routes, but they visually floated without a coherent head enclosure.

A new independent `treatmentHeadHousing` visualization layer now supplies a normalized flight-tube neck plus upper and lower cutaway head-body silhouette behind the existing target/window, filtering/scattering, monitor, optical and collimation DOM. It does not own physics or mode state and is shifted by the same treatment-head transform as the existing stack. No shielding thicknesses, service dimensions, proprietary clearances or clinical settings are represented.

Treatment head / beam path component visual fidelity moves **3 → 4/5** because the internal beamline now reads as one enclosed treatment-head assembly rather than floating components. It remains below DONE pending direct visual review of proportions and the Agility outer mechanical appearance.

## Next visual-fidelity gap
Audit and rebuild the **Agility leaf-bank/guide/sculpted-diaphragm mechanical appearance** against public Elekta imagery while preserving the existing 160-leaf topology, field-size causal behavior and Photon/Electron mode roles.

## Definition of done
Hardware is visually DONE only when source-backed topology, credible normalized silhouette/proportions, continuous mechanical/vacuum handoffs and regression-protected physics/animation are all present.

## Process note
When adding an enclosure around already-tested internals, implement it as a separate background visualization layer and reuse the existing assembly transform. This avoids rewriting mode-aware component initialization merely to improve silhouette fidelity.