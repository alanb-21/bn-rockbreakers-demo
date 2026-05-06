/* =====================================================================
   BEFORE / AFTER SLIDER — append to shared.js
   ===================================================================== */
document.querySelectorAll('.ba-slider').forEach(slider => {
  const after = slider.querySelector('.ba-after-wrap');
  const handle = slider.querySelector('.ba-handle');
  let dragging = false;

  function set(x) {
    const r = slider.getBoundingClientRect();
    let pct = ((x - r.left) / r.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    after.style.clipPath = `inset(0 0 0 ${pct}%)`;
    handle.style.left = pct + '%';
  }
  const start = (e) => { dragging = true; set((e.touches ? e.touches[0] : e).clientX); };
  const move  = (e) => { if (!dragging) return; set((e.touches ? e.touches[0] : e).clientX); };
  const end   = () => { dragging = false; };

  slider.addEventListener('mousedown', start);
  slider.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: true });
  window.addEventListener('mouseup', end);
  window.addEventListener('touchend', end);
});
