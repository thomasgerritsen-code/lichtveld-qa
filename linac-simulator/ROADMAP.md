# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 4 | 4 | 4 | 4 | 4 | In progress |
| Agility MLC / diaphragms | 4 | 4 | 4 | 4 | 5 | In progress |
| Electron gun / RF / waveguide | 4 | 4 | 4 | 4 | 4 | In progress |
| Focus / steering | 4 | 4 | 4 | 4 | 5 | In progress |
| Slalom bending / flight tube | 4 | 4 | 4 | 4 | 5 | In progress |
| Beam physics / patient-plane feedback | 3 | 4 | 3 | 4 | 4 | Priority |
| UI / educational readability | 4 | 4 | 4 | 4 | 4 | In progress |

## Golden path

Electron gun → RF / travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → Agility MLC / sculpted diaphragms → patient plane.

## Causality map

- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope compression → Focus 2 → downstream envelope compression.
- 1R/1T → primary injection centering; 2R/2T → downstream trajectory / target-angle alignment. Deliberate normalized mis-steering can produce wall interception / beam loss.
- Slalom M1 → initial energy-dispersive deflection → M2 counter-bend → M3 final achromatic redirection toward the treatment head. The displayed station sizes and gaps are normalized educational geometry.
- Photon mode → target → bremsstrahlung → FF/FFF section → monitor → Agility collimation.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → patient plane.

## Current evidence-backed improvement

Focus / steering graphics now expose the public Elekta SL25 stage order as physically distinct educational hardware: **Focus 1 → 1R/1T → Focus 2 → 2R/2T**. Focus stages are depicted as solenoid-style windings surrounding the waveguide, while each steering station shows two independently identifiable R and T channels. The primary steering station is labelled by role as injection centering and the secondary station as downstream / target-angle alignment. Positions are derived from the same `WAVE_ANCHORS` used by beam transport. All coil lengths, radii, drawing shapes and spacing are normalized educational illustration values; no OEM dimensions, currents, magnetic fields or service settings are represented.

## Recent evidence-backed improvements

- Electron mode depicts a dual scattering-foil topology: thin primary foil followed by a shaped secondary foil upstream of the monitor chamber, using normalized educational geometry only.
- Slalom graphics align three explicit normalized magnet stations with the same mechanical path used by the beam renderer, reducing geometry/renderer drift.
- Focus / steering graphics now distinguish focusing hardware from two-axis steering hardware and make the different 1R/1T versus 2R/2T roles visible without changing beam physics.

## Next highest-value gap

Beam physics / patient-plane feedback is now the lowest-scoring area. The next audit should check whether the patient-plane visualization makes source-backed qualitative changes in photon FF/FFF profiles, electron scatter/contamination, field size, steering loss and penumbra sufficiently visible and understandable, while keeping response curves normalized and non-clinical.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

A graphics change should preferentially derive display stations from the same geometry object used by beam transport rather than duplicating SVG coordinates. This reduces geometry/renderer drift while preserving the separation between machine topology, educational physics and presentation. This run reinforced that rule: the focus/steering overlay reads `WAVE_ANCHORS` rather than introducing a second independent stage-position map.
