// ----- Preloader (RD logo) -----
const preloader = document.querySelector('.preloader');
const preloaderReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const preloaderDone = new Promise((resolve) => {
  const root = document.documentElement;
  if (!preloader) { root.classList.remove('is-loading'); resolve(); return; }
  const startedAt = performance.now();
  const MIN_VISIBLE = preloaderReduceMotion ? 350 : 5600; // let the logo animation play out
  const MAX_VISIBLE = 8000;                                // never keep people waiting
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
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
