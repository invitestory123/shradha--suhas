/* Floral Effects:
   1. Flower showers on Save the Date
   2. Scrolling flower on timeline (Baraat Swagat -> Pheras -> Reception)
*/
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- 1. Flower Showers on Save the Date --- */
  const PETAL_COLORS = [
    'linear-gradient(135deg, #F9B4AB, #E76F51)',
    'linear-gradient(135deg, #F4A261, #E88850)',
    'linear-gradient(135deg, #E9C46A, #F3B700)',
    'linear-gradient(135deg, #F7CAD0, #DE6B78)',
    'linear-gradient(135deg, #FDE2E4, #F2A2A7)',
    'linear-gradient(135deg, #CD8D7A, #A65A4F)'
  ];

  function launchPetalShower(count = 42) {
    if (reduceMotion) return;
    const container = document.createElement('div');
    container.className = 'petal-shower-active';
    document.body.appendChild(container);

    const petals = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('i');
      const size = 10 + Math.random() * 16;
      el.style.width = size + 'px';
      el.style.height = (size * (0.6 + Math.random() * 0.3)) + 'px';
      el.style.background = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
      el.style.borderRadius = Math.random() > 0.5 ? '50% 0 50% 0' : '0 50% 0 50%';
      el.style.position = 'absolute';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      container.appendChild(el);

      petals.push({
        el,
        x: Math.random() * w,
        y: -(Math.random() * (h * 0.35) + 30),
        vx: (Math.random() - 0.5) * 2.2,
        vy: 1.5 + Math.random() * 3.2,
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 5,
        sway: Math.random() * Math.PI * 2,
        swayAmp: 0.6 + Math.random() * 1.2,
        opacity: 0,
        fadeIn: true,
        size
      });
    }

    let elapsed = 0;
    const totalDuration = 5200;
    let raf;

    function tick() {
      elapsed += 16;
      const progress = elapsed / totalDuration;

      petals.forEach(p => {
        if (p.fadeIn) {
          p.opacity = Math.min(p.opacity + 0.05, 0.95);
          if (p.opacity >= 0.95) p.fadeIn = false;
        }
        if (progress > 0.65) {
          p.opacity -= 0.012;
        }
        p.sway += 0.04;
        p.x += p.vx + Math.sin(p.sway) * p.swayAmp;
        p.y += p.vy;
        p.rot += p.rotV;

        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
        p.el.style.opacity = Math.max(0, p.opacity);
      });

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
        container.remove();
      }
    }
    raf = requestAnimationFrame(tick);
  }

  function initSaveDateShower() {
    const dateSection = document.querySelector('#date');
    if (!dateSection) return;

    let showered = false;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !showered) {
          showered = true;
          setTimeout(() => launchPetalShower(45), 350);
        }
      });
    }, { threshold: 0.25 });

    observer.observe(dateSection);

    const saveDateBtn = document.querySelector('#saveDateBtn');
    if (saveDateBtn) {
      saveDateBtn.addEventListener('click', () => launchPetalShower(35));
    }
    const scratchCard = document.querySelector('#scratchCard');
    if (scratchCard) {
      scratchCard.addEventListener('click', () => launchPetalShower(30));
    }
  }

  /* --- 2. Scrolling Flower on Timeline (Baraat Swagat -> Pheras -> Reception) --- */
  function initTimelineScrollingFlower() {
    const timeline = document.querySelector('#programTimeline');
    if (!timeline) return;

    function setupRunner() {
      const articles = timeline.querySelectorAll('article');
      if (articles.length < 2) {
        setTimeout(setupRunner, 100);
        return;
      }

      if (timeline.querySelector('.timeline-flower-runner')) return;

      const runner = document.createElement('div');
      runner.className = 'timeline-flower-runner';
      runner.setAttribute('aria-hidden', 'true');
      runner.innerHTML = `
        <svg viewBox="0 0 32 32" class="timeline-runner-svg" fill="none">
          <circle cx="16" cy="16" r="14" fill="rgba(243, 226, 179, 0.35)" />
          <path d="M16 2 C18 7, 25 7, 25 16 C25 25, 18 25, 16 30 C14 25, 7 25, 7 16 C7 7, 14 7, 16 2 Z" fill="#D4A853" opacity="0.9" />
          <path d="M2 16 C7 14, 7 7, 16 7 C25 7, 25 14, 30 16 C25 18, 25 25, 16 25 C7 25, 7 18, 2 16 Z" fill="#B88A45" opacity="0.9" />
          <path d="M6 6 C11 11, 21 11, 26 26 M26 6 C21 11, 11 21, 6 26" stroke="#906a36" stroke-width="1.2" />
          <circle cx="16" cy="16" r="4.5" fill="#5A4035" />
          <circle cx="16" cy="16" r="2.5" fill="#F3E2B3" />
        </svg>
      `;
      timeline.appendChild(runner);

      const firstArt = articles[0];
      const lastArt = articles[articles.length - 1];

      function updateFlowerPosition() {
        const firstRect = firstArt.getBoundingClientRect();
        const lastRect = lastArt.getBoundingClientRect();
        const viewportCenter = window.innerHeight * 0.52;

        const startY = firstRect.top + 24;
        const endY = lastRect.top + 24;
        const totalSpan = endY - startY;

        let progress = 0;
        if (totalSpan > 0) {
          progress = (viewportCenter - startY) / totalSpan;
          progress = Math.max(0, Math.min(1, progress));
        }

        const topStart = firstArt.offsetTop + 24;
        const topEnd = lastArt.offsetTop + 24;
        const currentTop = topStart + (topEnd - topStart) * progress;

        runner.style.top = currentTop + 'px';
        const rotation = progress * 720;
        const scale = 1 + 0.2 * Math.sin(progress * Math.PI);
        runner.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
      }

      window.addEventListener('scroll', updateFlowerPosition, { passive: true });
      window.addEventListener('resize', updateFlowerPosition, { passive: true });
      updateFlowerPosition();
    }

    setupRunner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSaveDateShower();
      initTimelineScrollingFlower();
    });
  } else {
    initSaveDateShower();
    initTimelineScrollingFlower();
  }
})();
