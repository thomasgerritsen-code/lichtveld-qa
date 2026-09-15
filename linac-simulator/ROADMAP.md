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
| Slalom bending / flight tube | 5 | 4 | 4 | 5 | 5 | 5 | Visual rebuild |
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
Public Elekta material establishes the Versa HD/Agility treatment platform and a compact gantry/head architecture; public accelerator literature supports a vacuum beam pipe passing through a multi-stage bending-magnet assembly before the treatment head. The existing simulator already had a shared normalized three-stage slalom trajectory, but its broad legacy polygons and isolated pole shoes read as floating diagram symbols rather than one mechanical beamline.

The slalom renderer now wraps the existing shared `buildMechanicalGeometry()` trajectory in a continuous normalized vacuum-tube silhouette. M1/M2/M3 are presented as integrated yoke/pole assemblies around that same tube, and the downstream end gains a flanged flight-tube housing. No bend angles, fields, currents, apertures, dimensions or service settings are claimed; the shapes remain normalized educational geometry. Existing beam trajectory, bending animation and physics state are unchanged.

Slalom bending / flight tube component visual fidelity moves **3 → 4/5** because the bend now reads as connected hardware around the established trajectory rather than detached SVG blocks. It remains below DONE pending the treatment-head body handoff and whole-stage proportion review.

## Next visual-fidelity gap
Rebuild the **treatment-head outer body and internal stack silhouette** around the existing target/window, FF/FFF or scattering, monitor, optical and Agility state. First establish a coherent housing and mechanical handoff from the flight tube; do not add controls or new physics.

## Definition of done
Hardware is visually DONE only when source-backed topology, credible normalized silhouette/proportions, continuous mechanical/vacuum handoffs and regression-protected physics/animation are all present.

## Process note
For visual rebuilds, reuse the same geometry object that drives the beam/trajectory whenever possible. A housing drawn from separate coordinates can look correct initially but silently drift away from the animated beam path later.