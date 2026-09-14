# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 4 | 4 | 4 | 4 | 4 | In progress |
| Agility MLC / diaphragms | 4 | 4 | 4 | 4 | 5 | In progress |
| Electron gun / RF / waveguide | 4 | 4 | 4 | 4 | 4 | In progress |
| Focus / steering | 4 | 4 | 3 | 4 | 4 | In progress |
| Slalom bending / flight tube | 3 | 4 | 3 | 4 | 4 | Priority |
| Beam physics / patient-plane feedback | 3 | 4 | 3 | 4 | 4 | In progress |
| UI / educational readability | 4 | 4 | 4 | 4 | 4 | In progress |

## Golden path

Electron gun → RF / travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → Agility MLC / sculpted diaphragms → patient plane.

## Causality map

- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope compression → Focus 2 → downstream envelope compression.
- 1R/1T and 2R/2T → trajectory correction → possible wall interception / beam loss when deliberately mis-steered.
- Photon mode → target → bremsstrahlung → FF/FFF section → monitor → Agility collimation.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → patient plane.

## Current evidence-backed improvement

Electron mode now depicts a **dual scattering-foil topology** rather than two generic shapes: a thin primary scattering foil followed downstream by a shaped secondary foil, upstream of the monitor chamber. This follows general IAEA clinical-linac teaching and peer-reviewed Elekta electron-foil literature. All illustrated dimensions and curvature are normalized educational geometry; no OEM foil thicknesses, materials, spacing or energy-specific settings are represented.

## Next highest-value gap

The slalom bending / flight-tube assembly remains the largest visual/topological gap. Future work should improve only publicly supported magnet/flight-tube relationships and trajectory readability, without reconstructing proprietary pole dimensions, magnetic field settings or service geometry.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.
