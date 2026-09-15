# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

## Visual fidelity override
The working animation/physics layers are protected while the machine drawing is rebuilt toward a mechanically coherent, source-backed educational cutaway. **Component visual fidelity has priority over new overlays, labels, controls or animation features.**

| Subsystem | Geometry / topology | Physics / behavior | Component visual fidelity | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 5 | 4 | 4 | 5 | 5 | 5 | Visual rebuild |
| Agility MLC / diaphragms | 5 | 4 | 4 | 5 | 5 | 5 | Visual rebuild |
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
Elekta public material and peer-reviewed Agility studies establish 160 interdigitating leaves in two 80-leaf banks, integrated dynamic leaf guides, rounded/eccentric leaf tips, no backup collimator in the leaf-travel direction, and a separate sculpted diaphragm pair on the orthogonal axis. The simulator already models the 160 leaves, rounded-tip topology and X/Y field-size causal roles, but the banks still read as floating leaf strips rather than one mechanical beam-shaping assembly.

A new independent `agility-bank-housing` visualization layer adds normalized bank shells and guide rails behind the existing leaves. It deliberately does not own leaf transforms, field-size physics, diaphragm motion or Photon/Electron mode state. The existing MLC groups remain the moving elements, so visual housing cannot silently alter aperture behavior. No leaf speed, carriage travel, clearances, dimensions, tolerances or service values are represented.

Agility MLC / diaphragms component visual fidelity moves **3 → 4/5** because the two leaf banks now read as supported mechanical assemblies while preserving the already-tested 160-leaf and sculpted-diaphragm topology.

## Next visual-fidelity gap
Perform an explicit end-to-end golden-path visual audit before another redraw. The main remaining question is whether relative scale and mechanical handoffs remain coherent across accelerator body → focus/steering → slalom/flight tube → treatment head → Agility after the successive independent housing passes.

## Definition of done
Hardware is visually DONE only when source-backed topology, credible normalized silhouette/proportions, continuous mechanical/vacuum handoffs and regression-protected physics/animation are all present.

## Process note
When a moving internal component already has tested transforms, keep its new mechanical housing static and independent unless public evidence requires the housing/carriage itself to move. This prevents a fidelity redraw from duplicating or perturbing established causal motion.