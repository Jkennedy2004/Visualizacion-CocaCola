// Funciones de visualización (placeholder)
function renderPlaceholder(el, title){
  el.innerHTML = `<div class="fade-in" style="border:1px solid #1b2430;padding:12px;border-radius:8px;">`+
                 `<strong>${title}</strong><br/><small>Visualización en construcción</small></div>`;
}
window.renderPlaceholder = renderPlaceholder;
console.log('[visualizations] listo');
