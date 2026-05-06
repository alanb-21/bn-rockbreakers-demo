/* =====================================================================
   MTMN TEMPLATE — SHARED JS
   All modules guard with early-returns, so pages without the relevant DOM
   pay nothing. Add new behaviours as their own IIFE block.
   ===================================================================== */

// ── 1. NAV scrolled state ───────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── 2. REVEAL on scroll ─────────────────────────────────────────────────
const __reveal = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      __reveal.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => __reveal.observe(el));

// ── 3. SERVICE CARD mouse-follow gradient ───────────────────────────────
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  });
});

// ── 4. STAT count-up on scroll ──────────────────────────────────────────
// Element should have data-count="<number>" and put the number in its first
// text node; trailing static suffix (e.g. "+", "★") sits in a child <em>.
const __statObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const duration = 1600;
    const start = performance.now();
    const textNode = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = (target * eased).toFixed(decimals);
      if (textNode) textNode.nodeValue = v;
      if (t < 1) requestAnimationFrame(tick);
    }
    if (textNode) { textNode.nodeValue = '0'; requestAnimationFrame(tick); }
    __statObs.unobserve(el);
  });
}, { threshold: 0.4 });
document.querySelectorAll('[data-count]').forEach(el => __statObs.observe(el));

// ── 5. FAQ accordion ────────────────────────────────────────────────────
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// ── 6. MOBILE NAV dropdown ──────────────────────────────────────────────
(function() {
  const trigger = document.getElementById('navMobileTrigger');
  const panel   = document.getElementById('navMobilePanel');
  if (!trigger || !panel) return;

  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!open));
    panel.classList.toggle('open', !open);
  });

  panel.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      trigger.setAttribute('aria-expanded', 'false');
      panel.classList.remove('open');
    });
  });

  document.addEventListener('click', e => {
    if (panel.classList.contains('open')
        && !panel.contains(e.target)
        && !trigger.contains(e.target)) {
      trigger.setAttribute('aria-expanded', 'false');
      panel.classList.remove('open');
    }
  });
})();

// ── 7. TESTIMONIALS carousel ────────────────────────────────────────────
(function() {
  const track = document.getElementById('testimonialTrack');
  if (!track) return;
  const slides = Array.from(track.querySelectorAll('.testimonial-slide'));
  const dotsWrap = document.getElementById('testimonialDots');
  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('.testimonial-dot')) : [];
  const prevBtn = document.querySelector('.testimonial-btn-prev');
  const nextBtn = document.querySelector('.testimonial-btn-next');
  const carousel = document.getElementById('testimonialCarousel');
  const DUR = 600;
  let current = 0, busy = false, timer;

  slides.forEach((s, i) => {
    s.style.opacity = '1';
    s.style.transform = i === 0 ? 'translateX(0)' : 'translateX(100%)';
    s.style.pointerEvents = i === 0 ? 'auto' : 'none';
  });

  function goTo(next, dir) {
    if (busy || next === current) return;
    busy = true;
    const from = slides[current], to = slides[next];
    const outX = dir === 'next' ? '-100%' : '100%';
    const inX  = dir === 'next' ?  '100%' : '-100%';

    from.style.transition = `transform ${DUR}ms cubic-bezier(0.4,0,0.2,1)`;
    from.style.transform  = `translateX(${outX})`;
    from.style.pointerEvents = 'none';

    to.style.transition = 'none';
    to.style.transform  = `translateX(${inX})`;
    to.getBoundingClientRect();
    to.style.transition = `transform ${DUR}ms cubic-bezier(0.16,1,0.3,1)`;
    to.style.transform  = 'translateX(0)';
    to.style.pointerEvents = 'auto';

    current = next;
    dots.forEach((d, i) => d.classList.toggle('dot-active', i === current));
    setTimeout(() => { busy = false; }, DUR + 50);
  }
  function next() { goTo((current + 1) % slides.length, 'next'); }
  function prev() { goTo((current - 1 + slides.length) % slides.length, 'prev'); }
  function startAuto() { timer = setInterval(next, 5400); }
  function stopAuto()  { clearInterval(timer); }
  function resetAuto() { stopAuto(); startAuto(); }

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAuto(); });
  dots.forEach((d, i) => d.addEventListener('click', () => {
    goTo(i, i > current ? 'next' : 'prev'); resetAuto();
  }));
  if (carousel) {
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
  }
  startAuto();
})();
