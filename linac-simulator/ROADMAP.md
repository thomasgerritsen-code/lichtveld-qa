# RT-VTech LINAC simulator roadmap

This scorecard is an educational engineering audit, not an OEM specification. Scores are 1–5 and only change when public evidence, code behaviour or regression coverage changes.

## Visual fidelity override

The working animation/physics layers are protected while the machine drawing is rebuilt toward a mechanically coherent, source-backed educational cutaway. **Component visual fidelity has priority over new overlays, labels, controls or animation features.** A change must not be merged when it makes the hardware depiction less credible even if its causal animation is useful.

Visual fidelity means: recognizable component silhouette; credible normalized relative proportions; continuous vacuum/mechanical connections; source-supported relative placement; and a coherent assembly rather than disconnected colored SVG blocks. Public photographs, manufacturer imagery, IAEA/AAPM teaching diagrams and peer-reviewed descriptions are references. All unverified dimensions remain normalized educational geometry; no OEM service geometry is reconstructed.

| Subsystem | Geometry / topology | Physics / behavior | Component visual fidelity | Graphics / readability | Cause-effect interaction | Regression coverage | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Treatment head / beam path | 5 | 4 | 3 | 5 | 5 | 5 | Visual rebuild |
| Agility MLC / diaphragms | 5 | 4 | 3 | 5 | 5 | 5 | Visual rebuild |
| Electron gun / RF / waveguide | 5 | 4 | 3 | 5 | 4 | 5 | Visual rebuild |
| Focus / steering | 4 | 4 | 4 | 5 | 5 | 5 | Visual rebuild |
| Slalom bending / flight tube | 5 | 4 | 3 | 5 | 5 | 5 | Visual rebuild |
| Beam physics / patient-plane feedback | 4 | 4 | n/a | 4 | 5 | 5 | Protected |
| UI / educational readability | 4 | 4 | n/a | 5 | 5 | 5 | Protected |

The visual-fidelity scores deliberately distinguish readability from realism: animation may be strong while component silhouettes and mechanical integration still need rebuilding.

## Golden path

Electron gun → RF feed / coupler → capture & bunching cells → travelling-wave acceleration → Focus 1 → 1R/1T → Focus 2 → 2R/2T → slalom bending / flight tube → photon target or electron window → photon filtering or electron scattering → monitor chamber → backscatter plate (photon head) → optical field system → Agility MLC / sculpted diaphragms or electron applicator → diverging field projection → isocentre / patient plane.

## Visual rebuild order

1. Establish a continuous accelerator vacuum/beamline body from electron gun through accelerating structure, focusing/steering assemblies and bend entrance.
2. Rebuild slalom/flight-tube mechanical silhouette around the existing shared beam geometry.
3. Rebuild the treatment-head stack as a mechanically coherent assembly around the existing mode-aware target/window/filter/foil/monitor/Agility state.
4. Refine Agility leaf-bank/guide/diaphragm appearance from public Elekta imagery without copying hidden dimensions.
5. Only after these stages re-evaluate additional educational overlays.

Each visual PR must compare the before-state against at least one manufacturer/public technical image plus one independent technical description where available. It must preserve existing physics/state APIs and golden-path scenario tests.

## Causality map

- Magnetron → RF feed waveguide → RF coupler → travelling-wave structure; entrance cells capture/bunch injected electrons before the main acceleration region. Coupler and region dimensions are normalized educational graphics.
- RF level → normalized accelerator response → useful beam response.
- Focus 1 → upstream envelope conditioning → 1R/1T primary injection centering / wall clearance → Focus 2 downstream envelope conditioning → 2R/2T downstream axis / target-angle alignment. Deliberate normalized mis-steering can produce wall interception / beam loss.
- 2R/2T → bend entry → M1 dispersive bend → M2 counter-bend → M3 final redirection → flight tube / treatment-head entrance.
- Photon mode → target → bremsstrahlung → FF inserted or FFF open filter position → monitor → backscatter plate → optical field system → Agility collimation → patient plane.
- Electron mode → exit window → primary + shaped secondary scattering foil → monitor → electron field definition / applicator → patient plane.
- Photon Field X → Agility MLC bank opening; Photon Field Y → orthogonal sculpted diaphragm pair.
- Steering/transport loss → beam-axis displacement and/or lower useful primary and patient-output proxy.

## Current evidence-backed improvement

Peer-reviewed work on Elekta travelling-wave linacs places two focus-coil sets **around the accelerating waveguide**, with Focus 1 upstream of 1R/1T and Focus 2 between primary and secondary steering. IAEA accelerator descriptions likewise show focusing coils as beamline assemblies around an accelerating/vacuum structure. The previous simulator used large detached diamond-like winding shapes that visually overwhelmed the tube.

Focus 1 and Focus 2 are now drawn as compact solenoidal sleeve/coil packs wrapped around the existing waveguide. The old shapes are visually retired but their DOM/component hooks remain, so existing focus physics, interaction, envelope animation and steering causality are unchanged. Coil-pack dimensions, turn spacing and colours are normalized educational illustration choices only; no coil current, magnetic field, winding dimensions or service values are represented.

## Next visual-fidelity gap

Continue stage 1 of the visual rebuild: audit the **electron gun → waveguide entrance / RF coupler → accelerating body** as one continuous vacuum/mechanical assembly. Prefer improving silhouette, flanges and physical handoffs over adding labels or controls. Preserve the current RF/beam animation and normalized physics.

## Definition of done

A hardware subsystem can be marked visually DONE only when public sources support its topology, its silhouette and normalized relative geometry are credible, mechanical/vacuum handoffs to neighboring components are visually continuous, mode-dependent behavior remains understandable, and regression tests preserve existing physics/animation. Cosmetic mini-tweaks do not reopen DONE hardware without new evidence or an integration defect.

## Process note

User review identified a failure mode not captured by the old scorecard: graphics/readability could score highly while the actual component depiction became less realistic. Keep **component visual fidelity** as a separate quality gate and reject future overlay/causality work that degrades hardware shape, proportion or mechanical coherence.
