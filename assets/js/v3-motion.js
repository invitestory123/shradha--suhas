/* Progressive motion: content stays visible even if this script cannot run. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const buttons = 'button, .event-btn, .venue-map-button, .calendar-cta';
  const press = event => {
    const target = event.target.closest(buttons);
    if (target) target.classList.add('v3-pressed');
  };
  const release = () => document.querySelectorAll('.v3-pressed').forEach(e => e.classList.remove('v3-pressed'));
  document.addEventListener('pointerdown', press);
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') press(event);
  });
  document.addEventListener('keyup', release);
  window.addEventListener('blur', release);
  const observed = new WeakSet();
  const decorations = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-inview', entry.isIntersecting));
  }, { threshold: 0 });
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal.unobserve(entry.target);
      if (!motion.matches && entry.target.animate) {
        entry.target.animate([
          { opacity: .45, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 720, delay: Number(entry.target.dataset.v3Delay || 0),
          easing: 'cubic-bezier(.2,.7,.25,1)', fill: 'backwards' });
      }
    });
  }, { threshold: .12 });
  function enhance() {
    document.querySelectorAll('.welcome-section, .gifts-section').forEach(section => {
      if (section.querySelector('.v3-botanical')) return;
      const ornament = document.createElement('span');
      ornament.className = 'v3-botanical';
      ornament.setAttribute('aria-hidden', 'true');
      section.prepend(ornament);
      decorations.observe(ornament);
    });
    document.querySelectorAll('.section-heading, .welcome-copy, .gallery-frame, .timeline article, .event-list article, .dress-copy, .gift-copy, .closing-arch').forEach(element => {
      if (observed.has(element)) return;
      observed.add(element);
      const siblings = element.parentElement.children;
      element.dataset.v3Delay = String(Math.min(Array.prototype.indexOf.call(siblings, element) * 65, 260));
      reveal.observe(element);
    });
  }
  const observer = new MutationObserver(enhance);
  observer.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
  enhance();
})();

