const DEG=Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function gantryEnvironment(angleDeg,direction='cw'){
  const g=angleDeg*DEG;
  const dir=direction==='ccw'?-1:1;
  // Normal gantry flex/hysteresis is a small correctable perturbation. The old
  // amplitudes were large enough to force even the nominal beam into the
  // waveguide wall at every angle, which made downstream animation impossible.
  const flex=.15;
  return {
    radial:{
      x:flex*(.0030*Math.sin(g+.35)+.0015*Math.sin(2*g-.2)),
      xp:flex*(.0075*Math.sin(g-.15)+dir*.0012*Math.cos(2*g))
    },
    transverse:{
      x:flex*(.0022*Math.cos(g+.55)+.0011*Math.sin(2*g+.8)),
      xp:flex*(.0062*Math.cos(g-.45)-dir*.0010*Math.sin(2*g+.1))
    }
  };
}

export function lutAssist(environment,angleDeg){
  const g=angleDeg*DEG;
  return {
    r2:-(environment.radial.xp*.72 + environment.radial.x*.12) - .00045*Math.sin(3*g),
    t2:-(environment.transverse.xp*.72 + environment.transverse.x*.12) - .00040*Math.cos(3*g)
  };
}

export function chamberSignals(sim){
  const t=sim.target;
  const doseLoss=Math.min(.16,Math.abs(t.r)*.8+Math.abs(t.t)*.8+Math.abs(t.rp)*.25+Math.abs(t.tp)*.25);
  return {
    doseA:1-doseLoss*.48 + t.r*.025,
    doseB:1-doseLoss*.48 - t.r*.025,
    radialTilt:clamp(t.r*.85+t.rp*.32,-.25,.25),
    transverseTilt:clamp(t.t*.85+t.tp*.32,-.25,.25)
  };
}

export function servoChannelPolicy(){
  return {
    r2:true,
    t2:false,
    basis:'conservative generic Elekta model: published 2R servo is always enabled, while 2T servo availability depends on the selected energy set'
  };
}

export function servoAssist(chamber){
  // van Appeldoorn et al. report the 2R servo as always enabled, while 2T is
  // disabled for all FFF and electron energies and is energy-set dependent for
  // conventional photon beams. This simulator has a continuous educational
  // energy slider rather than OEM Energy Sets, so it deliberately models only
  // the universally supported 2R servo path instead of pretending that 2T is
  // always available. Gains remain normalized teaching values.
  return {
    r2:clamp(chamber.radialTilt*.30,-.025,.025),
    t2:0
  };
}

export function buildControlContext({mode='manual',angleDeg=0,direction='cw',preSim=null}){
  const environment=gantryEnvironment(angleDeg,direction);
  const lut=mode==='lut'||mode==='servo'?lutAssist(environment,angleDeg):{r2:0,t2:0};
  const chamber=preSim?chamberSignals(preSim):{doseA:1,doseB:1,radialTilt:0,transverseTilt:0};
  const servo=mode==='servo'?servoAssist(chamber):{r2:0,t2:0};
  const servoPolicy=servoChannelPolicy();
  return {mode,angleDeg,direction,environment,lut,servo,servoPolicy,chamber};
}
