// Utilidades básicas
window.$ = (sel,ctx=document)=>ctx.querySelector(sel);
window.$$ = (sel,ctx=document)=>[...ctx.querySelectorAll(sel)];
console.log('[utils] listo');
