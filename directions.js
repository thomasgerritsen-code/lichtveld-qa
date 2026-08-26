'use strict';
// UI-normalisatie voor de vaste linac-richtingen:
// linksboven G/A, rechtsboven G/B, rechtsonder T/B, linksonder T/A.
(function(){
  const originalFillText=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,...args){
    if(typeof text==='string') text=text.replaceAll('TARGET','T');
    return originalFillText.call(this,text,...args);
  };
  const replaceNode=node=>{
    if(node.nodeType===Node.TEXT_NODE && node.nodeValue?.includes('TARGET')) node.nodeValue=node.nodeValue.replaceAll('TARGET','T');
    if(node.nodeType===Node.ELEMENT_NODE) node.childNodes.forEach(replaceNode);
  };
  const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(replaceNode)));
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();
