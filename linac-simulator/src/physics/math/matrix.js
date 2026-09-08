export const DEG=Math.PI/180;

export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const zeros4=()=>[0,0,0,0];

export function mv(M,v){
  return M.map(row=>row.reduce((sum,value,i)=>sum+value*v[i],0));
}

export function mm(A,B){
  return A.map(row=>B[0].map((_,j)=>row.reduce((sum,value,k)=>sum+value*B[k][j],0)));
}

export function mt(A){
  return A[0].map((_,j)=>A.map(row=>row[j]));
}

export function addv(a,b){
  return a.map((value,i)=>value+b[i]);
}

export function scalev(a,k){
  return a.map(value=>value*k);
}

export function covProp(S,M){
  return mm(mm(M,S),mt(M));
}
