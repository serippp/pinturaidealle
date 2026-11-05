const navigation = document.querySelector('.nav');
const menuButton = document.querySelector('.nav-toggle');
const compact = matchMedia('(max-width: 680px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function setMenu(open, returnFocus = false) {
  navigation.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  if (returnFocus) menuButton.focus();
}

navigation.classList.add('is-enhanced');
menuButton.hidden = false;
menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') === 'false');
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a') && compact.matches) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false, true);
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) setMenu(false);
});
compact.addEventListener('change', () => setMenu(false));

const hero = document.querySelector('.hero-video');
const heroMedia = document.querySelector('.hero-media');
const heroButton = document.querySelector('.hero-control');
const heroError = document.querySelector('.hero-error');
const filmLink = document.querySelector('.film-link');
const dialog = document.querySelector('.film-dialog');
const film = dialog.querySelector('video');
const dialogError = dialog.querySelector('.dialog-error');
const projectPlayers = [...document.querySelectorAll('[data-player]')];
let heroVisible = true;
let heroPreference;

function updateHeroButton() {
  const playing = !hero.paused;
  const label = playing ? 'Pausar vídeo de abertura' : 'Reproduzir vídeo de abertura';
  heroButton.classList.toggle('is-playing', playing);
  heroButton.setAttribute('aria-label', label);
  heroButton.title = label;
}

function syncHero() {
  const shouldPlay = heroPreference ?? !reducedMotion.matches;
  if (heroVisible && shouldPlay && !dialog.open && !document.hidden && !hero.error) {
    hero.play().catch(updateHeroButton);
  } else {
    hero.pause();
  }
}

hero.controls = false;
hero.muted = true;
heroButton.hidden = false;
if (hero.readyState < 2 && !hero.error && !reducedMotion.matches) heroMedia.classList.add('is-loading');
hero.addEventListener('loadeddata', () => heroMedia.classList.remove('is-loading'));
function showHeroError() {
  heroMedia.classList.remove('is-loading');
  heroButton.hidden = true;
  heroError.hidden = false;
}
hero.addEventListener('error', showHeroError);
if (hero.error) showHeroError();
hero.addEventListener('play', updateHeroButton);
hero.addEventListener('pause', updateHeroButton);
heroButton.addEventListener('click', () => {
  heroPreference = hero.paused;
  syncHero();
});
reducedMotion.addEventListener('change', () => {
  heroPreference = undefined;
  syncHero();
});
document.addEventListener('visibilitychange', syncHero);

if ('IntersectionObserver' in window) {
  const heroObserver = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    syncHero();
  }, { threshold: .05 });
  heroObserver.observe(heroMedia);

  const nearViewport = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.querySelector('video').preload = 'metadata';
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '160px' });
  projectPlayers.forEach(player => nearViewport.observe(player));

  if (!reducedMotion.matches) {
    const reveals = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('will-reveal');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: .1 });
    document.querySelectorAll('[data-reveal]').forEach(element => reveals.observe(element));
  }
}
syncHero();

if (typeof dialog.showModal === 'function') {
  filmLink.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    dialog.showModal();
    syncHero();
    for (const player of projectPlayers) player.querySelector('video').pause();
    if (!film.getAttribute('src')) film.src = filmLink.href;
    film.play().catch(() => {
      if (film.error) dialogError.hidden = false;
    });
  });
  film.addEventListener('error', () => { dialogError.hidden = false; });
  dialog.addEventListener('close', () => {
    film.pause();
    filmLink.focus();
    syncHero();
  });
}

for (const player of projectPlayers) {
  const video = player.querySelector('video');
  const button = player.querySelector('.project-play');
  const error = player.parentElement.querySelector('.player-error');

  video.controls = false;
  player.classList.add('is-ready');
  button.hidden = false;

  function showError() {
    error.hidden = false;
  }

  video.addEventListener('error', showError);
  button.addEventListener('click', async () => {
    error.hidden = true;
    try {
      if (video.error) video.load();
      await video.play();
      const moveFocus = document.activeElement === button;
      player.classList.add('has-played');
      video.controls = true;
      button.hidden = true;
      if (moveFocus) video.focus();
    } catch {
      if (video.error) showError();
      else video.controls = true;
    }
  });
  video.addEventListener('play', () => {
    for (const otherPlayer of projectPlayers) {
      if (otherPlayer !== player) otherPlayer.querySelector('video').pause();
    }
  });
}
