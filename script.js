// ----- Preloader (4 styles: 'mech', 'logo2', 'boot', 'logo' — switch in the <head> of index.html) -----
const preloader = document.querySelector('.preloader');
const preloaderReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const preloaderDone = new Promise((resolve) => {
  const root = document.documentElement;
  if (!preloader) { root.classList.remove('is-loading'); resolve(); return; }
  const startedAt = performance.now();
  const MIN_VISIBLE = preloaderReduceMotion ? 350 : 5600; // let the animation play out (same for both styles)
  const MAX_VISIBLE = 8000;                                // never keep people waiting
  let finished = false;

  // 'boot' and 'mech' styles: 0 -> 100% counter + progress bar, in step with the animation
  const progressNums = preloader.querySelectorAll('.pb-num, .mc-num');
  const progressBars = preloader.querySelectorAll('.pb-bar i, .mc-bar i');
  const setProgress = (p) => {
    progressNums.forEach((el) => { el.textContent = Math.round(p * 100); });
    progressBars.forEach((el) => { el.style.transform = 'scaleX(' + p + ')'; });
  };
  if (progressNums.length && !preloaderReduceMotion) {
    // 'mech' reaches 100% when the logo locks together (see .mc-bar data-count-ms); 'boot' just before the curtain closes
    const COUNT_MS = root.dataset.preloader === 'mech' ? 4200 : MIN_VISIBLE - 400;
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const tick = (now) => {
      if (finished) return;
      const t = Math.min(1, (now - startedAt) / COUNT_MS);
      setProgress(ease(t));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else setProgress(1);

  const finish = () => {
    if (finished) return;
    finished = true;
    setProgress(1);
    preloader.classList.add('is-done');
    preloader.setAttribute('aria-hidden', 'true');
    root.classList.remove('is-loading');
    setTimeout(resolve, preloaderReduceMotion ? 150 : 450);
  };
  const finishWhenReady = () => setTimeout(finish, Math.max(0, MIN_VISIBLE - (performance.now() - startedAt)));
  if (document.readyState === 'complete') finishWhenReady();
  else window.addEventListener('load', finishWhenReady, { once: true });
  setTimeout(finish, MAX_VISIBLE);
});

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.desktop-nav');

menuButton.addEventListener('click', () => {
  const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isExpanded));
  menuButton.setAttribute('aria-label', isExpanded ? 'Open navigation menu' : 'Close navigation menu');
  navigation.classList.toggle('is-open', !isExpanded);
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    navigation.classList.remove('is-open');
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();

const themeButtons = document.querySelectorAll('.theme-toggle');
const favicon = document.querySelector('#favicon');
const applyTheme = (theme) => {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  themeButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    button.title = `Switch to ${isDark ? 'light' : 'dark'} mode`;
    button.querySelector('.theme-icon').textContent = isDark ? '☀' : '☾';
  });
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#343434' : '#ffffff';
  if (favicon) favicon.href = isDark ? 'assets/favicon-dark.png' : 'assets/favicon-light.png';
};

applyTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
themeButtons.forEach((button) => button.addEventListener('click', () => {
  const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(nextTheme);
  try { localStorage.setItem('portfolio-theme', nextTheme); } catch (_) {}
}));

const revealTargets = document.querySelectorAll('.hero-copy, .hero-art, .hero-title, .hero-meta, .hero-bottomline, .section-heading, .about-grid, .skills-intro, .skill-group, .certificate-card, .projects-title, .project-card, .contact-content');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('has-scroll-reveal');
  revealTargets.forEach((element, index) => {
    element.classList.add('reveal-on-scroll');
    if (element.matches('.skill-group, .certificate-card, .project-card')) {
      element.style.setProperty('--reveal-delay', `${(index % 3) * 45}ms`);
    }
  });
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
      } else {
        entry.target.classList.remove('is-revealed');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  // start revealing the page only once the preloader has lifted
  preloaderDone.then(() => revealTargets.forEach((element) => revealObserver.observe(element)));
}

// ----- AutoCAD drawings lightbox: arrow, main image and thumbnails open a viewer for all drawings -----
(() => {
  const card = document.querySelector('.project-four');
  if (!card) return;
  const thumbs = [...card.querySelectorAll('.cad-thumbs a')];
  if (!thumbs.length) return;
  const items = thumbs.map((a) => ({ src: a.getAttribute('href'), alt: a.querySelector('img').alt }));

  const box = document.createElement('div');
  box.className = 'cad-lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'AutoCAD drawings viewer');
  box.hidden = true;
  box.innerHTML =
    '<button type="button" class="cad-lb-btn cad-lb-close" aria-label="Close viewer">×</button>' +
    '<button type="button" class="cad-lb-btn cad-lb-prev" aria-label="Previous drawing">←</button>' +
    '<figure class="cad-lb-figure"><img alt="" /><figcaption></figcaption></figure>' +
    '<button type="button" class="cad-lb-btn cad-lb-next" aria-label="Next drawing">→</button>';
  document.body.appendChild(box);

  const img = box.querySelector('img');
  const caption = box.querySelector('figcaption');
  const closeBtn = box.querySelector('.cad-lb-close');
  const buttons = [...box.querySelectorAll('button')];
  let index = 0;
  let lastFocus = null;

  const show = (i) => {
    index = (i + items.length) % items.length;
    img.src = items[index].src;
    img.alt = items[index].alt;
    caption.textContent = `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')} — ${items[index].alt.replace(/^AutoCAD drawing \d+:\s*/i, '')}`;
  };
  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    closeBtn.focus();
  };
  const close = () => {
    box.hidden = true;
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  card.querySelectorAll('a[target="_blank"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return; // let people open in a new tab if they want to
      e.preventDefault();
      const t = thumbs.indexOf(a);
      open(t === -1 ? 0 : t);
    });
  });

  box.querySelector('.cad-lb-prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.cad-lb-next').addEventListener('click', () => show(index + 1));
  closeBtn.addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'Tab') {
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // swipe on touch screens
  let startX = null;
  box.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
})();


// ----- Resume preview -----
(() => {
  const modal = document.getElementById('resume-modal');
  if (!modal) return;
  const openers = document.querySelectorAll('[data-resume-open]');
  const closeBtn = modal.querySelector('.resume-close');
  let lastFocus = null;
  const open = () => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  openers.forEach((b) => b.addEventListener('click', open));
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.classList.contains('resume-modal-body')) close(); });
  document.addEventListener('keydown', (e) => { if (!modal.hidden && e.key === 'Escape') close(); });
})();
