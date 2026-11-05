// SVGElement does not implement HTMLElement.hidden. Reflect the property used
// by the existing renderers so mode switching also changes actual SVG display.
export function initSvgVisibility(){
  if('hidden' in SVGElement.prototype)return;
  Object.defineProperty(SVGElement.prototype,'hidden',{
    configurable:true,
    get(){return this.hasAttribute('hidden');},
    set(value){this.toggleAttribute('hidden',Boolean(value));}
  });
}
