# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

## Visual fidelity override
The working animation/physics layers are protected while the machine drawing is rebuilt toward a mechanically coherent, source-backed educational cutaway. **Component visual fidelity has priority over new overlays, labels, controls or animation features.** A change must not be merged when it makes the hardware depiction less credible even if its causal animation is useful.

| Subsystem | Geometry / topology | Physics / behavior | Component visual fidelity | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 5 | 4 | 3 | 5 | 5 | 5 | Visual rebuild |
| Agility MLC / diaphragms | 5 | 4 | 3 | 5 | 5 | 5 | Visual rebuild |
| Electron gun / RF / waveguide | 5 | 4 | 4 | 5 | 4 | 5 | Visual rebuild |
| Focus / steering | 4 | 4 | 4 | 5 | 5 | 5 | Visual rebuild |
| Slalom bending / flight tube | 5 | 4 | 3 | 5 | 5 | 5 | Visual rebuild |
| Beam physics / patient-plane feedback | 4 | 4 | n/a | 4 | 5 | 5 | Protected |
| UI / educational readability | 4 | 4 | n/a | 5 | 5 | 5 | Protected |

## Golden path
Electron gun → RF feed / coupler → capture & bunching cells → travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → backscatter plate → optical field system → Agility MLC / sculpted diaphragms or electron applicator → patient plane.

## Visual rebuild order
1. Continuous accelerator vacuum/beamline body from electron gun through accelerating structure, focusing/steering and bend entrance.
2. Slalom/flight-tube mechanical silhouette around shared beam geometry.
3. Treatment-head stack as a coherent assembly around existing mode-aware state.
4. Agility leaf-bank/guide/diaphragm appearance from public imagery.
5. Only then re-evaluate additional overlays.

## Causality map
- Magnetron → RF feed → RF coupler → travelling-wave structure → normalized accelerator response.
- Focus 1 → envelope → 1R/1T centering/wall clearance → Focus 2 → 2R/2T downstream alignment.
- 2R/2T → bend entry → M1 → M2 → M3 → flight tube / treatment-head entrance.
- Photon → target → bremsstrahlung → FF/FFF → monitor → Agility → patient plane.
- Electron → exit window → scattering foils → monitor → applicator → patient plane.

## Current evidence-backed improvement
IAEA teaching material shows electron gun, input coupler, accelerating cells and focusing solenoid as one connected accelerator guide; IAEA radiotherapy physics describes the accelerating guide as a vacuum system, while public Elekta literature confirms travelling-wave acceleration and gun/target-end vacuum infrastructure. The previous drawing exposed internal electrodes and cells but left their outer mechanical/vacuum continuity visually weak.

The gun now has a normalized vacuum housing/neck and anode-side flange silhouette, and the accelerating structure has a continuous outer vacuum envelope with entrance/end flanges. Existing cathode/control/anode graphics, RF input, cells, focus/steering, RF animation and beam physics are retained. These shapes are normalized educational geometry, not OEM dimensions.

Electron gun / RF / waveguide component visual fidelity moves **3 → 4/5** because the assembly now reads as connected hardware rather than isolated internal symbols. It remains below DONE pending a later whole-stage proportion audit against manufacturer imagery.

## Next visual-fidelity gap
Continue the rebuild with **slalom bend + flight tube mechanical silhouette and its handoff into the treatment-head body**. Preserve the shared beam geometry and bending animation; improve housings, pole/yoke coherence and vacuum-tube continuity rather than adding labels.

## Definition of done
Hardware is visually DONE only when source-backed topology, credible normalized silhouette/proportions, continuous mechanical/vacuum handoffs and regression-protected physics/animation are all present.

## Process note
When redrawing internals, first establish the enclosing mechanical/vacuum silhouette and only then add internal detail. This prevents technically correct electrodes/cells from reading as disconnected floating symbols.
