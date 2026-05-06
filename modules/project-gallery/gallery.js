/* =====================================================================
   PROJECT GALLERY — append to shared.js
   ===================================================================== */
(function() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.gallery-card');
  if (!filterBtns.length) return;
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tag = btn.dataset.filter;
      cards.forEach(c => {
        const match = tag === 'all' || c.dataset.tag === tag;
        c.classList.toggle('hidden', !match);
      });
    });
  });
})();
