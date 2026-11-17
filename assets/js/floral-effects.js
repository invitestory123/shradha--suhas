/* Floral Effects:
   Flower showers animation on Save the Date
*/
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Flower Showers on Save the Date --- */
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
        targetOpacity: 0.75 + Math.random() * 0.25,
        life: 0,
        maxLife: 180 + Math.random() * 120
      });
    }

    let frameId;
    function animate() {
      let alive = 0;
      for (const p of petals) {
        p.life++;
        p.y += p.vy;
        p.sway += 0.04;
        p.x += p.vx + Math.sin(p.sway) * p.swayAmp;
        p.rot += p.rotV;

        if (p.life < 20) {
          p.opacity = (p.life / 20) * p.targetOpacity;
        } else if (p.life > p.maxLife - 30) {
          p.opacity = Math.max(0, ((p.maxLife - p.life) / 30) * p.targetOpacity);
        }

        if (p.life <= p.maxLife && p.y < h + 40) {
          alive++;
          p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rot}deg)`;
          p.el.style.opacity = p.opacity;
        } else {
          p.el.style.opacity = '0';
        }
      }

      if (alive > 0) {
        frameId = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(frameId);
        container.remove();
      }
    }

    frameId = requestAnimationFrame(animate);
  }

  function initSaveDateShower() {
    const dateSection = document.querySelector('.date-section') || document.querySelector('#date');
    if (!dateSection) return;

    let hasTriggered = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasTriggered) {
          hasTriggered = true;
          launchPetalShower(50);
          setTimeout(() => {
            launchPetalShower(30);
          }, 1200);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSaveDateShower();
    });
  } else {
    initSaveDateShower();
  }
})();
