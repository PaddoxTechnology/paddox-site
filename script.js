// PERSPECTIVE GRID FLOOR
(function () {
  const hero = document.querySelector('.hero-section');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position:'absolute', inset:'0', width:'100%', height:'100%', zIndex:'2', pointerEvents:'none' });
  hero.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let sunriseStart = null;
  const SUNRISE_DURATION = 4500; // ms to reach full brightness

  function resize() {
    W = canvas.width = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    const horizonY = H * 0.62;
    const floorH = H - horizonY;
    const vp = W / 2;

    // number of vertical grid lines each side of centre
    const vLines = 12;
    // spacing at the bottom edge
    const spread = W * 0.7;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, horizonY, W, floorH);
    ctx.clip();

    // horizon glow — wide ellipse spanning full grid area
    const hgr = ctx.createRadialGradient(W / 2, horizonY, 0, W / 2, horizonY, W * 0.70);
    hgr.addColorStop(0,    'rgba(37,99,235,0.42)');
    hgr.addColorStop(0.28, 'rgba(124,58,237,0.18)');
    hgr.addColorStop(0.60, 'rgba(37,99,235,0.06)');
    hgr.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = hgr;
    // fill from above the horizon down through the entire floor so glow covers the grid
    ctx.fillRect(0, horizonY - 200, W, H - horizonY + 200);


    // depth offset drives gentle forward-scroll
    const depthOffset = (t * 0.00007) % 1;

    // ----- horizontal lines — swell traveling bottom-right → back-left -----
    // Phase = x*kx + depth*kd + omega*t  →  crests travel in -(x,depth) direction
    const hCount = 26;
    const kx  = 0.0058;
    const kd  = kx * W * 0.38;   // diagonal tilt: crests shift ~38% of W across depth range
    const om1 = 0.00068;
    const om2 = 0.00042;

    for (let i = 0; i <= hCount; i++) {
      const raw = (i + depthOffset) / hCount;
      const depth = raw * raw;
      const baseY = horizonY + floorH * depth;
      if (baseY > H + 2) continue;

      const amp = depth * depth * 22;

      // combining x*kx + depth*kd in the argument makes crests diagonal lines
      // running upper-right → lower-left; positive om*t slides them leftward over time
      const ph1 = kd * depth + om1 * t;
      const ph2 = kd * 0.63 * depth + om2 * t + 1.6;

      const alpha = 0.07 + 0.26 * depth;
      ctx.beginPath();
      const seg = 72;
      for (let s = 0; s <= seg; s++) {
        const x = (s / seg) * W;
        const y = baseY
          + Math.sin(x * kx + ph1) * amp
          + Math.sin(x * 0.0033 + ph2) * amp * 0.40;
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(37,99,235,${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.75 + depth * 0.65;
      ctx.stroke();
    }

    // ----- vertical lines converging to vanishing point -----
    for (let i = -vLines; i <= vLines; i++) {
      const xBottom = vp + (i / vLines) * spread;
      const alpha = 0.05 + 0.14 * (1 - Math.abs(i) / vLines);
      ctx.beginPath();
      ctx.moveTo(vp, horizonY);
      ctx.lineTo(xBottom, H);
      ctx.strokeStyle = `rgba(37,99,235,${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }

    ctx.restore();

    // ── pre-dawn sunrise — careers page only ──
    if (window.PADDOX_SUNRISE) {
      // entry trigger: ease in from 0 → 1 over SUNRISE_DURATION ms
      if (!sunriseStart) sunriseStart = t;
      const raw      = Math.min(1, (t - sunriseStart) / SUNRISE_DURATION);
      const progress = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;

      // slow breathe: 0.65→1.0 intensity over ~4s, secondary flicker over ~7s
      const breathe = 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.00085));
      const flicker = 0.92 + 0.08 * Math.sin(t * 0.00230 + 1.4);
      const pulse   = breathe * flicker * progress;

      // radius also gently expands/contracts with the pulse
      const sunRadius = W * (0.165 + 0.018 * Math.sin(t * 0.00070));
      const skyGlow   = Math.min(horizonY, sunRadius * 1.4);

      const sunGr = ctx.createRadialGradient(W / 2, horizonY, 0, W / 2, horizonY, sunRadius);
      sunGr.addColorStop(0,    `rgba(255,230,100,${(0.80 * pulse).toFixed(3)})`);
      sunGr.addColorStop(0.25, `rgba(255,160,40,${(0.45 * pulse).toFixed(3)})`);
      sunGr.addColorStop(0.60, `rgba(255,80,10,${(0.12 * pulse).toFixed(3)})`);
      sunGr.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = sunGr;
      ctx.fillRect(0, horizonY - skyGlow, W, skyGlow);

      // corona: second wider, softer halo that pulses out of phase
      const haloPhase  = (0.55 + 0.45 * Math.sin(t * 0.00060 + 2.1)) * progress;
      const haloRadius = W * 0.30;
      const haloGr = ctx.createRadialGradient(W / 2, horizonY, sunRadius * 0.6, W / 2, horizonY, haloRadius);
      haloGr.addColorStop(0,   `rgba(255,140,30,${(0.18 * haloPhase).toFixed(3)})`);
      haloGr.addColorStop(0.5, `rgba(220,60,5,${(0.07 * haloPhase).toFixed(3)})`);
      haloGr.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = haloGr;
      ctx.fillRect(0, horizonY - Math.min(horizonY, haloRadius * 1.3), W, Math.min(horizonY, haloRadius * 1.3));

      // sun-line brightness pulses with the breathe
      const lineAlpha = pulse;
      const sunLine = ctx.createLinearGradient(0, 0, W, 0);
      sunLine.addColorStop(0,    'rgba(255,210,60,0)');
      sunLine.addColorStop(0.35, 'rgba(255,220,80,0)');
      sunLine.addColorStop(0.43, `rgba(255,238,130,${(0.60 * lineAlpha).toFixed(3)})`);
      sunLine.addColorStop(0.50, `rgba(255,248,160,${(0.95 * lineAlpha).toFixed(3)})`);
      sunLine.addColorStop(0.57, `rgba(255,238,130,${(0.60 * lineAlpha).toFixed(3)})`);
      sunLine.addColorStop(0.65, 'rgba(255,220,80,0)');
      sunLine.addColorStop(1,    'rgba(255,210,60,0)');
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(W, horizonY);
      ctx.strokeStyle = sunLine;
      ctx.lineWidth = 1.2 + 0.8 * pulse;
      ctx.stroke();
    }

    // fade mask — top of floor fades to transparent, edges fade out
    const topFade = ctx.createLinearGradient(0, horizonY, 0, horizonY + floorH * 0.45);
    topFade.addColorStop(0, 'rgba(5,11,20,0.92)');
    topFade.addColorStop(1, 'rgba(5,11,20,0)');
    ctx.fillStyle = topFade;
    ctx.fillRect(0, horizonY, W, floorH * 0.45);

    const leftFade = ctx.createLinearGradient(0, 0, W * 0.18, 0);
    leftFade.addColorStop(0, 'rgba(5,11,20,0.85)');
    leftFade.addColorStop(1, 'rgba(5,11,20,0)');
    ctx.fillStyle = leftFade;
    ctx.fillRect(0, horizonY, W * 0.18, floorH);

    const rightFade = ctx.createLinearGradient(W, 0, W * 0.82, 0);
    rightFade.addColorStop(0, 'rgba(5,11,20,0.85)');
    rightFade.addColorStop(1, 'rgba(5,11,20,0)');
    ctx.fillStyle = rightFade;
    ctx.fillRect(W * 0.82, horizonY, W * 0.18, floorH);

    requestAnimationFrame(draw);
  }

  resize();
  raf = requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
}());

// SPACE STARFIELD
(function () {
  const hero = document.querySelector('.hero-section');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position:'absolute', inset:'0', width:'100%', height:'100%', zIndex:'0', pointerEvents:'none' });
  hero.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let stars = [], W = 0, H = 0;

  function resize() {
    W = canvas.width = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    build();
  }

  function build() {
    stars = [];
    // Background field — small, dim
    for (let i = 0; i < 180; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H * 0.78,
        r: Math.random() * 0.9 + 0.15, base: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 0.0032 + 0.0010, phase: Math.random() * Math.PI * 2, glow: false });
    }
    // Foreground — brighter, with a soft halo
    for (let i = 0; i < 28; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H * 0.7,
        r: Math.random() * 1.1 + 1.0, base: Math.random() * 0.3 + 0.65,
        speed: Math.random() * 0.0018 + 0.0007, phase: Math.random() * Math.PI * 2, glow: true });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const wave = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const a = s.base * (0.08 + 0.92 * Math.pow(wave, 2.2));
      if (s.glow) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        g.addColorStop(0, `rgba(190,215,255,${a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,235,255,${a})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  requestAnimationFrame(draw);
  window.addEventListener('resize', resize);
}());

// NAVBAR
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  updateActiveNav();
});

// MOBILE MENU
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinksEl.classList.toggle('open'));
navLinksEl.querySelectorAll('a').forEach(l => l.addEventListener('click', () => navLinksEl.classList.remove('open')));

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); window.scrollTo({ top: t.offsetTop - 94, behavior: 'smooth' }); }
  });
});

// ACTIVE NAV
function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 130) current = s.id; });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
}

// SCROLL REVEAL
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const delay = parseInt(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .hub-card, .ind-col, .more-ind-card, .value-card, .partner-card, .cap-card, .tech-item, .pillar-item, .ai-card').forEach((el, i) => {
  el.classList.add('reveal');
  el.dataset.delay = (i % 5) * 70;
  observer.observe(el);
});

// Directional reveals
document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up').forEach(el => {
  observer.observe(el);
});

// ANIMATED STAT COUNTERS
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.a-num[data-target]').forEach(el => {
  el.textContent = '0' + (el.dataset.suffix || '');
  counterObserver.observe(el);
});

// FLIP CARD — proximity magnetic tilt before hover flip
(function () {
  const cards = Array.from(document.querySelectorAll('.flip-card'));
  if (!cards.length) return;

  document.addEventListener('mousemove', e => {
    cards.forEach(card => {
      const inner = card.querySelector('.flip-inner');
      if (!inner) return;

      // don't fight the CSS :hover flip while cursor is on the card
      if (card.matches(':hover')) {
        inner.style.transition = '';
        inner.style.transform  = '';
        return;
      }

      const r    = card.getBoundingClientRect();
      const cx   = r.left + r.width  / 2;
      const cy   = r.top  + r.height / 2;
      const dx   = e.clientX - cx;
      const dy   = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const maxDist = 240;

      if (dist < maxDist) {
        const strength = Math.pow(1 - dist / maxDist, 2) * 9;
        const tiltX = (dy / (dist || 1)) * -strength;
        const tiltY = (dx / (dist || 1)) *  strength;
        inner.style.transition = 'transform 0.2s ease';
        inner.style.transform  = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      } else {
        inner.style.transition = 'transform 0.5s ease';
        inner.style.transform  = '';
      }
    });
  });
}());

// VIDEO SCROLL PLAYBACK — play only when video is in view
(function () {
  const videos = document.querySelectorAll('.video-slot video');
  if (!videos.length) return;

  // Start all videos paused regardless of the autoplay attribute
  videos.forEach(v => { v.pause(); });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.45 });

  videos.forEach(v => observer.observe(v));
}());

// GLOW CURSOR
(function () {
  const el = document.createElement('div');
  el.id = 'glow-cursor';
  document.body.appendChild(el);

  let cx = -100, cy = -100;

  document.addEventListener('mousemove', e => {
    cx = e.clientX;
    cy = e.clientY;
    el.style.left = cx + 'px';
    el.style.top  = cy + 'px';
  });

  document.addEventListener('mouseleave', () => { el.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { el.style.opacity = '1'; });
}());

// RESEARCH SLIDER
(function () {
  const track   = document.getElementById('rsTrack');
  const counter = document.getElementById('rsCounter');
  const btnPrev = document.getElementById('rsPrev');
  const btnNext = document.getElementById('rsNext');
  const btnPause= document.getElementById('rsPause');
  if (!track) return;

  const slides = track.querySelectorAll('.rs-slide');
  const total  = slides.length;
  let cur = 0, playing = true, timer;

  function goTo(n) {
    cur = ((n % total) + total) % total;
    track.style.transform = `translateX(-${cur * 100}%)`;
    counter.textContent   = `${cur + 1}/${total}`;
    btnNext.classList.toggle('rs-btn-active', true);
  }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(() => { if (playing) goTo(cur + 1); }, 5000);
  }

  btnNext.addEventListener('click',  () => { goTo(cur + 1); startAuto(); });
  btnPrev.addEventListener('click',  () => { goTo(cur - 1); startAuto(); });
  btnPause.addEventListener('click', () => {
    playing = !playing;
    btnPause.innerHTML = playing
      ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="4" height="12" rx="1"/><rect x="8" y="1" width="4" height="12" rx="1"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1l10 6-10 6V1z"/></svg>';
  });

  startAuto();
}());

// CONTACT FORM
// ISO BLADE SCROLL CONTROLLER — draggable track flips blades
(function () {
  const track  = document.getElementById('isoTrack');
  const thumb  = document.getElementById('isoThumb');
  const blades = Array.from(document.querySelectorAll('.iso-blade'));
  if (!track || !thumb || !blades.length) return;

  let dragging = false;

  function setActive(idx) {
    idx = Math.max(0, Math.min(blades.length - 1, idx));
    blades.forEach((b, i) => b.classList.toggle('iso-blade--active', i === idx));
    track.setAttribute('aria-valuenow', idx + 1);
    positionThumb(idx);
  }

  function positionThumb(idx) {
    const thumbH  = thumb.offsetHeight;
    const trackH  = track.offsetHeight;
    const usable  = trackH - thumbH;
    const pct     = blades.length > 1 ? idx / (blades.length - 1) : 0;
    thumb.style.top = (pct * usable) + 'px';
  }

  function clientYToIndex(clientY) {
    const rect   = track.getBoundingClientRect();
    const thumbH = thumb.offsetHeight;
    const usable = rect.height - thumbH;
    const relY   = clientY - rect.top - thumbH / 2;
    const pct    = Math.max(0, Math.min(1, relY / usable));
    return Math.round(pct * (blades.length - 1));
  }

  // Mouse
  track.addEventListener('mousedown', e => {
    dragging = true;
    setActive(clientYToIndex(e.clientY));
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (dragging) setActive(clientYToIndex(e.clientY));
  });
  document.addEventListener('mouseup', () => { dragging = false; });

  // Touch
  track.addEventListener('touchstart', e => {
    dragging = true;
    setActive(clientYToIndex(e.touches[0].clientY));
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', e => {
    if (dragging) setActive(clientYToIndex(e.touches[0].clientY));
  }, { passive: true });
  document.addEventListener('touchend', () => { dragging = false; });

  // Keyboard (arrow keys when track is focused)
  track.setAttribute('tabindex', '0');
  track.addEventListener('keydown', e => {
    const cur = blades.findIndex(b => b.classList.contains('iso-blade--active'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setActive(cur + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  { e.preventDefault(); setActive(cur - 1); }
  });

  // Init
  setActive(0);
}());

// SERVICES SLIDER
(function () {
  const track   = document.getElementById('svcTrack');
  const prevBtn = document.getElementById('svcPrev');
  const nextBtn = document.getElementById('svcNext');
  const counter = document.getElementById('svcCounter');
  if (!track || !prevBtn || !nextBtn) return;

  const slides = track.querySelectorAll('.svc-slide');
  const tabs   = document.querySelectorAll('.svc-tab');
  const total  = slides.length;
  let current  = 0;

  function update() {
    track.style.transform = `translateX(-${current * 100}%)`;
    if (counter) {
      const cur = String(current + 1).padStart(2, '0');
      const tot = String(total).padStart(2, '0');
      counter.textContent = `${cur} / ${tot}`;
    }
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    tabs.forEach((tab, i) => tab.classList.toggle('svc-tab--active', i === current));
  }

  prevBtn.addEventListener('click', () => { if (current > 0)         { current--; update(); } });
  nextBtn.addEventListener('click', () => { if (current < total - 1) { current++; update(); } });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      current = parseInt(tab.dataset.slide);
      update();
    });
  });

  // Keyboard arrow support
  document.addEventListener('keydown', e => {
    if (!document.getElementById('services')) return;
    if (e.key === 'ArrowLeft')  { if (current > 0)         { current--; update(); } }
    if (e.key === 'ArrowRight') { if (current < total - 1) { current++; update(); } }
  });

  update();
}());

// PARTNERS CAROUSEL
(function () {
  const track   = document.getElementById('partnersTrack');
  const prevBtn = document.getElementById('partnerPrev');
  const nextBtn = document.getElementById('partnerNext');
  if (!track || !prevBtn || !nextBtn) return;

  const slides = track.querySelectorAll('.partner-slide');
  let current  = 0;
  const max    = slides.length - 1;

  function update() {
    const slideW = slides[0].offsetWidth;
    track.style.transform = `translateX(-${current * slideW}px)`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === max;
  }

  prevBtn.addEventListener('click', () => { if (current > 0)   { current--; update(); } });
  nextBtn.addEventListener('click', () => { if (current < max) { current++; update(); } });

  window.addEventListener('resize', update);
  update();
}());

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.textContent = '✅ Message Sent!';
    btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
    setTimeout(() => { btn.textContent = 'Send Message →'; btn.style.background = ''; this.reset(); }, 3500);
  });
}
