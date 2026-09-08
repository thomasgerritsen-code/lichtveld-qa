export function sectorM(theta,rho){
  const c=Math.cos(theta),s=Math.sin(theta);
  const L=Math.abs(theta*rho)*.55;
  return [
    [c,rho*s,0,0],
    [-s/rho,c,0,0],
    [0,0,1,L],
    [0,0,0,1]
  ];
}

export function sectorDispersion(theta,rho,scale=1){
  const c=Math.cos(theta),s=Math.sin(theta);
  return [rho*(1-c)*scale,s*scale,0,0];
}
