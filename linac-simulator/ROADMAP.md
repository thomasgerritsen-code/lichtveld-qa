# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

| Subsystem | Geometry / topology | Physics / behavior | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 5 | 4 | 5 | 4 | 5 | In progress |
| Agility MLC / diaphragms | 5 | 4 | 5 | 4 | 5 | In progress |
| Electron gun / RF / waveguide | 5 | 4 | 5 | 4 | 5 | In progress |
| Focus / steering | 4 | 4 | 4 | 4 | 5 | Priority |
| Slalom bending / flight tube | 4 | 4 | 4 | 4 | 5 | In progress |
| Beam physics / patient-plane feedback | 4 | 4 | 4 | 5 | 5 | In progress |
| UI / educational readability | 4 | 4 | 5 | 5 | 5 | In progress |

## Golden path

Electron gun → RF feed / coupler → capture & bunching cells → travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → backscatter plate (photon head) → optical field system → Agility MLC / sculpted diaphragms or electron applicator → diverging field projection → isocentre / patient plane.

## Causality map

- Magnetron → RF feed waveguide → RF coupler → travelling-wave structure; entrance cells capture/bunch injected electrons before the main acceleration region. Coupler and region dimensions are normalized educational graphics.
- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope compression → Focus 2 → downstream envelope compression.
- 1R/1T → primary injection centering; 2R/2T → downstream trajectory / target-angle alignment. Deliberate normalized mis-steering can produce wall interception / beam loss.
- Slalom M1 → initial energy-dispersive deflection → M2 counter-bend → M3 final achromatic redirection toward the treatment head. The displayed station sizes and gaps are normalized educational geometry.
- Photon mode → target → bremsstrahlung → FF/FFF section → monitor → backscatter plate → optical field system → Agility collimation → diverging field projection → patient-plane field/profile feedback.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → diverging field projection → patient plane, with separate normalized electron-scatter and photon-contamination teaching components.
- Field X/Y → MLC/diaphragm or electron-field aperture → projected field opening → visible patient-plane field width/height; steering/transport loss → beam-axis displacement and/or lower useful primary and patient-output proxy.

## Current evidence-backed improvement

The Agility head now exposes the **dynamic leaf guides** around both 80-leaf banks rather than depicting the 160 leaves as mechanically unsupported strips. Public Agility descriptions identify 160 interdigitating leaves, integrated dynamic leaf guides, and a single orthogonal pair of sculpted diaphragms rather than backup jaws. The existing renderer already depicts 80 leaves per bank, eccentric rounded leaf ends and sculpted diaphragms; this run closes the remaining visible topology gap by making the bank-guide relationship explicit and marking the orthogonal diaphragm assembly as having no backup-jaw role.

The guide outlines frame the existing normalized leaf-bank envelope and move with the same bank group as the leaves. Their coordinates are schematic only: no OEM guide travel, clearances, dimensions, leaf speeds, positioning tolerances or service values are modeled. Existing MLC/field physics remains the single behavior model.

## Recent evidence-backed improvements

- Electron mode depicts a dual scattering-foil topology: thin primary foil followed by a shaped secondary foil upstream of the monitor chamber, using normalized educational geometry only.
- Slalom graphics align three explicit normalized magnet stations with the same mechanical path used by the beam renderer, reducing geometry/renderer drift.
- Focus / steering graphics distinguish focusing hardware from two-axis steering hardware and make the different 1R/1T versus 2R/2T roles visible without changing beam physics.
- Patient-plane feedback makes FF/FFF shape, electron secondary components, field size, steering displacement and useful-output loss visible in one causal view sourced from the existing physics state.
- Head-to-isocentre projection closes the visible spatial gap between treatment-head field definition and the patient plane without implying OEM distances.
- Golden-path navigation links the full machine chain into one selectable, mode-aware educational sequence on desktop and mobile.
- Photon-head topology explicitly includes the source-supported monitor backscatter plate between the chamber and field-light mirror.
- Source/RF graphics expose RF feed → coupler → capture/bunching → main travelling-wave acceleration as distinct educational stages.
- Agility graphics expose 80 leaves per bank, eccentric rounded tips, integrated dynamic leaf guides and the orthogonal sculpted diaphragm pair as separate source-supported roles.

## Next highest-value gap

Agility now meets the current source-supported 5/5 threshold for topology, graphics and regression coverage. Physics and interaction remain 4/5 because no machine-specific leaf dynamics or calibration values are appropriate. Rotate to **Focus / steering** next: audit whether the current normalized Focus 1/2 and 1R/1T/2R/2T representation can more clearly connect the two steering planes to trajectory, wall interception and downstream target alignment without inventing service values. If public evidence does not support a meaningful improvement, leave main unchanged and rotate again.

## Definition of done

A subsystem can be marked DONE when public sources support its topology, normalized relative geometry is credible and readable, mode-dependent behavior and cause→effect are understandable, and regression tests cover its core behavior. DONE areas are not revisited for cosmetic micro-tweaks without new evidence or integration need.

## Process note

When a source-supported subsystem is already numerically represented, audit whether its **supporting mechanical topology** is also visible before adding new controls. A missing structural relationship (for example leaf banks moving inside dynamic guides) is a higher-value educational correction than adding another slider or machine-specific response curve. Keep such geometry tied to the same DOM/state group as the component it supports so visualization cannot drift from interaction.