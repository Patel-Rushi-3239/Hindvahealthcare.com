/* =====================================================================
   HINDVA HEALTHCARE PVT. LTD. — Complete JavaScript Bundle
   Merged from: counter.js, world-map.js, animations.js, main.js
   ===================================================================== */

/* =====================================================================
   SECTION 1 — ANIMATED COUNTERS
   (originally: counter.js)
   ===================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------
     EASING: easeOutExpo
     ------------------------------------------------- */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  /* -------------------------------------------------
     FORMAT NUMBER (commas + optional suffix)
     ------------------------------------------------- */
  function formatNumber(num) {
    if (num >= 1000) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return num.toString();
  }

  /* -------------------------------------------------
     ANIMATE A SINGLE COUNTER ELEMENT
     ------------------------------------------------- */
  function animateCounter(element) {
    if (element.classList.contains('counted')) return;
    element.classList.add('counted');

    const target = parseInt(element.getAttribute('data-target'), 10);
    if (isNaN(target) || target <= 0) {
      element.textContent = '0';
      return;
    }

    const suffix = element.getAttribute('data-suffix') || '';
    const duration = 1200;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = Math.floor(easedProgress * target);
      element.textContent = formatNumber(current) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = formatNumber(target) + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  /* -------------------------------------------------
     INTERSECTION OBSERVER
     ------------------------------------------------- */
  function initCounters() {
    const counterElements = document.querySelectorAll('.counter, .stat-number');
    if (counterElements.length === 0) return;

    const counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.5 }
    );

    counterElements.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounters);
  } else {
    initCounters();
  }
})();


/* =====================================================================
   SECTION 2 — INTERACTIVE WORLD MAP
   (originally: world-map.js)
   ===================================================================== */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* -------------------------------------------------
     COUNTRY DATA
     ------------------------------------------------- */
  var countries = [
    { name: 'India', x: 721, y: 178, major: true },
    { name: 'Bangladesh', x: 751, y: 175 },
    { name: 'Belarus', x: 578, y: 93 },
    { name: 'Bhutan', x: 751, y: 165 },
    { name: 'Brazil', x: 352, y: 271 },
    { name: 'Cambodia', x: 791, y: 206 },
    { name: 'United Arab Emirates', x: 651, y: 175 },
    { name: 'Ghana', x: 497, y: 219 },
    { name: 'Indonesia', x: 826, y: 247 },
    { name: 'Iran', x: 651, y: 151 },
    { name: 'Iraq', x: 622, y: 149 },
    { name: 'Jordan', x: 602, y: 154 },
    { name: 'Kenya', x: 605, y: 240 },
    { name: 'Kuwait', x: 632, y: 160 },
    { name: 'Libya', x: 550, y: 166 },
    { name: 'Malaysia', x: 805, y: 231 },
    { name: 'Nepal', x: 733, y: 163 },
    { name: 'Nigeria', x: 522, y: 215 },
    { name: 'Oman', x: 656, y: 184 },
    { name: 'Philippines', x: 841, y: 209 },
    { name: 'Russia', x: 766, y: 58 },
    { name: 'South Korea', x: 855, y: 140 },
    { name: 'Sri Lanka', x: 724, y: 220 },
    { name: 'Switzerland', x: 523, y: 111 },
    { name: 'Tanzania', x: 597, y: 259 },
    { name: 'United Kingdom', x: 492, y: 92 },
    { name: 'Vietnam', x: 795, y: 195 },
    { name: 'Yemen', x: 632, y: 197 },
    { name: 'Zambia', x: 577, y: 278 },
    { name: 'Zimbabwe', x: 583, y: 294 },
    { name: 'Mauritius', x: 645, y: 265 }
  ];

  // Removed continentPaths array as we will use a realistic background image map.

  /* -------------------------------------------------
     CONNECTION LINES (India to major markets)
     ------------------------------------------------- */
  var connectionTargets = [
    { name: 'Brazil', x: 310, y: 350 },
    { name: 'United Kingdom', x: 470, y: 150 },
    { name: 'Nigeria', x: 470, y: 310 },
    { name: 'Russia', x: 650, y: 130 },
    { name: 'Indonesia', x: 740, y: 330 },
    { name: 'Kenya', x: 560, y: 330 },
    { name: 'South Korea', x: 770, y: 210 },
  ];

  var indiaX = 721;
  var indiaY = 178;

  /* -------------------------------------------------
     BUILD SVG
     ------------------------------------------------- */
  function initWorldMap() {
    var container = document.getElementById('world-map');
    if (!container) return;

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1000 500');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.height = '100%';

    var defs = document.createElementNS(SVG_NS, 'defs');

    var glowFilter = document.createElementNS(SVG_NS, 'filter');
    glowFilter.setAttribute('id', 'dotGlow');
    glowFilter.setAttribute('x', '-50%');
    glowFilter.setAttribute('y', '-50%');
    glowFilter.setAttribute('width', '200%');
    glowFilter.setAttribute('height', '200%');

    var feGauss = document.createElementNS(SVG_NS, 'feGaussianBlur');
    feGauss.setAttribute('in', 'SourceGraphic');
    feGauss.setAttribute('stdDeviation', '2');
    feGauss.setAttribute('result', 'blur');
    glowFilter.appendChild(feGauss);

    var feMerge = document.createElementNS(SVG_NS, 'feMerge');
    var feMergeNode1 = document.createElementNS(SVG_NS, 'feMergeNode');
    feMergeNode1.setAttribute('in', 'blur');
    var feMergeNode2 = document.createElementNS(SVG_NS, 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    glowFilter.appendChild(feMerge);
    defs.appendChild(glowFilter);

    var lineGrad = document.createElementNS(SVG_NS, 'linearGradient');
    lineGrad.setAttribute('id', 'lineGradient');
    lineGrad.setAttribute('gradientUnits', 'userSpaceOnUse');
    var stop1 = document.createElementNS(SVG_NS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#0d47a1');
    stop1.setAttribute('stop-opacity', '0.6');
    var stop2 = document.createElementNS(SVG_NS, 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#00bf58');
    stop2.setAttribute('stop-opacity', '0.3');
    lineGrad.appendChild(stop1);
    lineGrad.appendChild(stop2);
    defs.appendChild(lineGrad);
    svg.appendChild(defs);


    var linesGroup = document.createElementNS(SVG_NS, 'g');
    linesGroup.setAttribute('class', 'connection-lines');
    connectionTargets.forEach(function (target, idx) {
      var midX = (indiaX + target.x) / 2;
      var midY = (indiaY + target.y) / 2 - 40 - idx * 5;
      var line = document.createElementNS(SVG_NS, 'path');
      var pathData =
        'M ' + indiaX + ',' + indiaY +
        ' Q ' + midX + ',' + midY +
        ' ' + target.x + ',' + target.y;
      line.setAttribute('d', pathData);
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', 'url(#lineGradient)');
      line.setAttribute('stroke-width', '0.8');
      line.setAttribute('stroke-dasharray', '4 6');
      line.setAttribute('opacity', '0.4');
      line.style.animation = 'dashFlow ' + (3 + idx * 0.5) + 's linear infinite';
      linesGroup.appendChild(line);
    });
    svg.appendChild(linesGroup);

    var colors = ['#f44336', '#4caf50', '#2196f3', '#3f51b5', '#9c27b0'];
    var dotsGroup = document.createElementNS(SVG_NS, 'g');
    dotsGroup.setAttribute('class', 'country-dots');
    countries.forEach(function (country, idx) {
      var dotGroup = document.createElementNS(SVG_NS, 'g');
      dotGroup.setAttribute('class', 'dot-group');
      dotGroup.setAttribute('data-country', country.name);

      var pinColor = colors[idx % colors.length];
      if (country.major) pinColor = '#f44336'; // Headquarter / major in red

      // Add a subtle glowing shadow under the pin
      var shadow = document.createElementNS(SVG_NS, 'ellipse');
      shadow.setAttribute('cx', country.x);
      shadow.setAttribute('cy', country.y);
      shadow.setAttribute('rx', '6');
      shadow.setAttribute('ry', '3');
      shadow.setAttribute('fill', 'rgba(0,0,0,0.15)');
      shadow.setAttribute('filter', 'url(#dotGlow)');
      dotGroup.appendChild(shadow);

      // SVG Map Pin Teardrop Shape
      var pinGroup = document.createElementNS(SVG_NS, 'g');
      // Position the point of the teardrop at (country.x, country.y)
      // Standard SVG pin path bounding box is roughly 0 0 24 24, tip at 12,24
      pinGroup.setAttribute('transform', 'translate(' + (country.x - 12) + ',' + (country.y - 24) + ') scale(1)');
      pinGroup.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      pinGroup.style.cursor = 'pointer';

      var pinPath = document.createElementNS(SVG_NS, 'path');
      pinPath.setAttribute('d', 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z');
      pinPath.setAttribute('fill', pinColor);
      pinPath.setAttribute('stroke', '#ffffff');
      pinPath.setAttribute('stroke-width', '1');
      pinPath.style.transition = 'fill 0.3s ease';

      var pinHole = document.createElementNS(SVG_NS, 'circle');
      pinHole.setAttribute('cx', '12');
      pinHole.setAttribute('cy', '9');
      pinHole.setAttribute('r', '3.5');
      pinHole.setAttribute('fill', '#ffffff');

      pinGroup.appendChild(pinPath);
      pinGroup.appendChild(pinHole);
      dotGroup.appendChild(pinGroup);

      svg.appendChild(dotGroup);

      dotGroup.addEventListener('mouseenter', function () {
        pinGroup.setAttribute('transform', 'translate(' + (country.x - 12) + ',' + (country.y - 30) + ') scale(1.15)');
        showTooltip(country.name, country.x, country.y, container, svg);
      });
      dotGroup.addEventListener('mouseleave', function () {
        pinGroup.setAttribute('transform', 'translate(' + (country.x - 12) + ',' + (country.y - 24) + ') scale(1)');
        hideTooltip();
      });
    });
    svg.appendChild(dotsGroup);
    container.appendChild(svg);
    injectMapStyles();
  }

  /* -------------------------------------------------
     TOOLTIP
     ------------------------------------------------- */
  var tooltipEl = null;

  function createTooltip() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'map-tooltip';
    tooltipEl.style.cssText =
      'position:absolute;padding:8px 16px;' +
      'background:linear-gradient(135deg,rgba(255,255,255,0.95),rgba(240,244,248,0.95));' +
      'border:1px solid rgba(0,229,255,0.4);border-radius:8px;' +
      'color:#1a1a2e;font-size:13px;font-weight:600;letter-spacing:0.5px;' +
      'pointer-events:none;z-index:100;opacity:0;' +
      'transition:opacity 0.25s ease, transform 0.25s ease;' +
      'transform:translateY(5px);white-space:nowrap;' +
      'box-shadow:0 4px 20px rgba(0,0,0,0.4),0 0 15px rgba(0,229,255,0.15);';
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  function showTooltip(name, svgX, svgY, container, svg) {
    var tip = createTooltip();
    tip.textContent = name;
    var svgRect = svg.getBoundingClientRect();
    var scaleX = svgRect.width / 1000;
    var scaleY = svgRect.height / 500;
    var pageX = svgRect.left + svgX * scaleX;
    var pageY = svgRect.top + svgY * scaleY;
    tip.style.left = (pageX + window.scrollX - tip.offsetWidth / 2) + 'px';
    tip.style.top = (pageY + window.scrollY - 45) + 'px';
    tip.style.opacity = '1';
    tip.style.transform = 'translateY(0)';
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.style.opacity = '0';
      tooltipEl.style.transform = 'translateY(5px)';
    }
  }

  /* -------------------------------------------------
     INJECT CSS FOR MAP ANIMATIONS
     ------------------------------------------------- */
  function injectMapStyles() {
    var style = document.createElement('style');
    style.textContent =
      '@keyframes dotPulse {' +
        '0% { opacity: 0.4; transform: scale(1); }' +
        '50% { opacity: 0.15; transform: scale(1.8); }' +
        '100% { opacity: 0.4; transform: scale(1); }' +
      '}' +
      '.dot-pulse { animation: dotPulse 3s ease-in-out infinite; }' +
      '.dot-group:nth-child(odd) .dot-pulse { animation-delay: -1.5s; }' +
      '.dot-group:nth-child(3n) .dot-pulse { animation-duration: 3.5s; }' +
      '.dot-group:nth-child(5n) .dot-pulse { animation-duration: 2.5s; }' +
      '@keyframes dotBreathe {' +
        '0%, 100% { opacity: 0.85; } 50% { opacity: 1; }' +
      '}' +
      '.map-dot { animation: dotBreathe 2.5s ease-in-out infinite; }' +
      '@keyframes dashFlow {' +
        '0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -20; }' +
      '}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorldMap);
  } else {
    initWorldMap();
  }
})();


/* =====================================================================
   SECTION 3 — GSAP ANIMATIONS + PARTICLES + TILT
   (originally: animations.js)
   ===================================================================== */
(function () {
  'use strict';

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 600, easing: 'ease-out-cubic', once: true, offset: 100 });
  }

  /* -------------------------------------------------
     HERO ANIMATIONS
     ------------------------------------------------- */
  function playHeroAnimations() {
    if (typeof gsap === 'undefined') return;
    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTimeline
      .fromTo('.hero-badge', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.15 })
      .fromTo('#hero h1', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.25')
      .fromTo('#hero p', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.25')
      .fromTo('.hero-buttons', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.25')
      .fromTo('.hero-stats', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.25');
  }

  function waitForLoader() {
    if (document.body.classList.contains('loaded')) {
      playHeroAnimations();
    } else {
      const loaderObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.type === 'attributes' && m.attributeName === 'class' && document.body.classList.contains('loaded')) {
            playHeroAnimations();
            loaderObserver.disconnect();
          }
        });
      });
      loaderObserver.observe(document.body, { attributes: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForLoader);
  } else {
    waitForLoader();
  }

  /* -------------------------------------------------
     SECTION TITLE ANIMATIONS
     ------------------------------------------------- */
  function initSectionTitleAnimations() {
    if (typeof gsap === 'undefined') return;
    document.querySelectorAll('.section-title').forEach(function (title) {
      const h2 = title.querySelector('h2');
      const p = title.querySelector('p');
      const line = title.querySelector('.title-line');
      const tl = gsap.timeline({
        scrollTrigger: { trigger: title, start: 'top 80%', end: 'bottom 20%', toggleActions: 'play none none none' },
      });
      if (h2) tl.fromTo(h2, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
      if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'power2.out' }, '-=0.2');
      if (p) tl.fromTo(p, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, '-=0.2');
    });
  }

  /* -------------------------------------------------
     CARD STAGGER ANIMATIONS
     ------------------------------------------------- */
  function initCardAnimations() {
    if (typeof gsap === 'undefined') return;
    const cardSelectors = ['.product-card', '.cert-card', '.feature-card', '.mv-card', '.founder-card'];
    cardSelectors.forEach(function (selector) {
      const cards = document.querySelectorAll(selector);
      if (cards.length === 0) return;
      ScrollTrigger.batch(cards, {
        onEnter: function (batch) {
          gsap.fromTo(batch, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', overwrite: true });
        },
        start: 'top 85%',
        once: true,
      });
    });
  }

  /* -------------------------------------------------
     ABOUT TIMELINE ANIMATION
     ------------------------------------------------- */
  function initAboutTimeline() {
    if (typeof gsap === 'undefined') return;
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length === 0) return;
    ScrollTrigger.batch(timelineItems, {
      onEnter: function (batch) {
        gsap.fromTo(batch, { x: -35, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, stagger: 0.1, ease: 'power3.out', overwrite: true });
      },
      start: 'top 85%',
      once: true,
    });
  }

  /* -------------------------------------------------
     CONTACT SECTION ANIMATION
     ------------------------------------------------- */
  function initContactAnimation() {
    if (typeof gsap === 'undefined') return;
    const contactForm = document.querySelector('.contact-form');
    const contactInfo = document.querySelector('.contact-info');
    if (contactForm) {
      gsap.fromTo(contactForm, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: contactForm, start: 'top 80%', toggleActions: 'play none none none' } });
    }
    if (contactInfo) {
      gsap.fromTo(contactInfo, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: contactInfo, start: 'top 80%', toggleActions: 'play none none none' } });
    }
  }

  /* -------------------------------------------------
     PARALLAX BACKGROUND BLOBS
     ------------------------------------------------- */
  function initParallaxBlobs() {
    if (typeof gsap === 'undefined') return;
    const blobs = document.querySelectorAll('.floating-blob');
    if (blobs.length === 0) return;
    blobs.forEach(function (blob, index) {
      const speed = 0.3 + index * 0.15;
      const direction = index % 2 === 0 ? 1 : -1;
      gsap.to(blob, {
        y: function () { return direction * 80 * speed; },
        x: function () { return direction * -30 * speed; },
        ease: 'none',
        scrollTrigger: { trigger: blob.closest('section') || blob.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
      });
    });
  }

  /* -------------------------------------------------
     HERO PARTICLE SYSTEM (Canvas)
     ------------------------------------------------- */
  function initHeroParticles() {
    const heroCanvas = document.querySelector('.hero-canvas');
    if (!heroCanvas) return;
    const ctx = heroCanvas.getContext('2d');
    if (!ctx) return;
    let isVisible = true;

    function resizeCanvas() {
      const hero = document.getElementById('hero');
      if (hero) { heroCanvas.width = hero.offsetWidth; heroCanvas.height = hero.offsetHeight; }
      else { heroCanvas.width = window.innerWidth; heroCanvas.height = window.innerHeight; }
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particleTypes = ['circle', 'plus', 'dot', 'capsule'];
    const colors = ['rgba(13, 71, 161, ', 'rgba(0, 191, 88, '];
    const particleCount = 90;
    const particles = [];

    function createParticle(randomY) {
      const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
      const colorBase = colors[Math.floor(Math.random() * colors.length)];
      const opacity = 0.08 + Math.random() * 0.25;
      const size = type === 'capsule' ? 3 + Math.random() * 5 : 1.5 + Math.random() * 3.5;
      return {
        x: Math.random() * heroCanvas.width,
        y: randomY ? Math.random() * heroCanvas.height : heroCanvas.height + Math.random() * 60,
        size, type,
        color: colorBase + opacity + ')',
        speedY: -(0.25 + Math.random() * 0.7),
        speedX: (Math.random() - 0.5) * 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      };
    }

    for (let i = 0; i < particleCount; i++) particles.push(createParticle(true));

    function drawParticle(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      switch (p.type) {
        case 'circle': ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill(); break;
        case 'dot': ctx.beginPath(); ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2); ctx.fill(); break;
        case 'plus':
          ctx.lineWidth = 1; ctx.beginPath();
          ctx.moveTo(-p.size, 0); ctx.lineTo(p.size, 0);
          ctx.moveTo(0, -p.size); ctx.lineTo(0, p.size); ctx.stroke(); break;
        case 'capsule':
          var w = p.size * 2.2, h = p.size, radius = h / 2;
          ctx.beginPath();
          ctx.moveTo(-w / 2 + radius, -h / 2); ctx.lineTo(w / 2 - radius, -h / 2);
          ctx.arc(w / 2 - radius, 0, radius, -Math.PI / 2, Math.PI / 2);
          ctx.lineTo(-w / 2 + radius, h / 2);
          ctx.arc(-w / 2 + radius, 0, radius, Math.PI / 2, -Math.PI / 2);
          ctx.closePath(); ctx.fill(); break;
      }
      ctx.restore();
    }

    function animateParticles() {
      if (!isVisible) { requestAnimationFrame(animateParticles); return; }
      ctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
      for (let i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.speedX; p.y += p.speedY; p.rotation += p.rotationSpeed;
        if (p.y < -20 || p.x < -20 || p.x > heroCanvas.width + 20) particles[i] = createParticle(false);
        drawParticle(p);
      }
      requestAnimationFrame(animateParticles);
    }

    const heroEl = document.getElementById('hero');
    if (heroEl) {
      const visibilityObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { isVisible = entry.isIntersecting; });
      }, { threshold: 0.05 });
      visibilityObserver.observe(heroEl);
    }
    animateParticles();
  }

  /* -------------------------------------------------
     3D TILT EFFECT
     ------------------------------------------------- */
  function initTiltEffect() {
    const tiltElements = document.querySelectorAll('.tilt-card, .product-card');
    if (tiltElements.length === 0) return;
    const maxRotation = 5;
    tiltElements.forEach(function (el) {
      el.style.transition = 'transform 0.15s ease-out';
      el.style.transformStyle = 'preserve-3d';
      el.addEventListener('mousemove', function (e) {
        const rect = el.getBoundingClientRect();
        const mouseX = e.clientX - (rect.left + rect.width / 2);
        const mouseY = e.clientY - (rect.top + rect.height / 2);
        const rotateY = (mouseX / (rect.width / 2)) * maxRotation;
        const rotateX = -(mouseY / (rect.height / 2)) * maxRotation;
        el.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(5px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      });
    });
  }

  /* -------------------------------------------------
     FLOATING BLOBS (Dynamic)
     ------------------------------------------------- */
  function initFloatingBlobs() {
    const blobColors = [
      'radial-gradient(circle, rgba(13,71,161,0.05) 0%, transparent 70%)',
      'radial-gradient(circle, rgba(0,191,88,0.04) 0%, transparent 70%)',
      'radial-gradient(circle, rgba(13,71,161,0.03) 0%, transparent 70%)',
      'radial-gradient(circle, rgba(0,191,88,0.05) 0%, transparent 70%)',
    ];
    const blobSizes = [300, 400, 350, 280];
    for (var i = 0; i < 4; i++) {
      var blob = document.createElement('div');
      blob.className = 'dynamic-floating-blob';
      var size = blobSizes[i];
      var startX = Math.random() * 80 + 5;
      var startY = Math.random() * 70 + 10;
      var animDuration = 18 + Math.random() * 12;
      var animDelay = Math.random() * -15;
      blob.style.cssText =
        'position:fixed;width:' + size + 'px;height:' + size + 'px;' +
        'background:' + blobColors[i] + ';border-radius:50%;' +
        'top:' + startY + '%;left:' + startX + '%;pointer-events:none;z-index:0;' +
        'filter:blur(40px);animation:blobMove' + (i + 1) + ' ' + animDuration + 's ease-in-out infinite;' +
        'animation-delay:' + animDelay + 's;will-change:transform;';
      document.body.appendChild(blob);
    }
    var style = document.createElement('style');
    style.textContent =
      '@keyframes blobMove1{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(80px,-60px) scale(1.1)}50%{transform:translate(-40px,50px) scale(0.95)}75%{transform:translate(60px,30px) scale(1.05)}}' +
      '@keyframes blobMove2{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(-70px,40px) scale(1.08)}50%{transform:translate(50px,-50px) scale(0.92)}75%{transform:translate(-30px,-60px) scale(1.03)}}' +
      '@keyframes blobMove3{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(50px,70px) scale(1.05)}50%{transform:translate(-60px,-30px) scale(0.97)}75%{transform:translate(40px,-50px) scale(1.1)}}' +
      '@keyframes blobMove4{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(-50px,-40px) scale(1.12)}50%{transform:translate(70px,60px) scale(0.9)}75%{transform:translate(-40px,50px) scale(1.06)}}';
    document.head.appendChild(style);
  }

  /* -------------------------------------------------
     INITIALIZE ALL ANIMATIONS
     ------------------------------------------------- */
  function initAllAnimations() {
    initSectionTitleAnimations();
    initCardAnimations();
    initAboutTimeline();
    initContactAnimation();
    initParallaxBlobs();
    initHeroParticles();
    initTiltEffect();
    initFloatingBlobs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllAnimations);
  } else {
    initAllAnimations();
  }
})();


/* =====================================================================
   SECTION 4 — MAIN UI INTERACTIONS
   (originally: main.js)
   ===================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------
     1. LOADING SCREEN
     ------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      document.body.classList.add('loaded');
    }, 800);
  });

  /* -------------------------------------------------
     2. SCROLL PROGRESS BAR
     ------------------------------------------------- */
  const scrollProgress = document.getElementById('scroll-progress');

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = scrollPercent + '%';
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });

  /* -------------------------------------------------
     3. CURSOR GLOW EFFECT
     ------------------------------------------------- */
  const cursorGlow = document.getElementById('cursor-glow');
  let cursorX = 0, cursorY = 0, glowX = 0, glowY = 0;
  const glowLerp = 0.12;

  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

  if (isTouchDevice && cursorGlow) cursorGlow.style.display = 'none';

  if (!isTouchDevice && cursorGlow) {
    document.addEventListener('mousemove', function (e) { cursorX = e.clientX; cursorY = e.clientY; });
    function animateCursorGlow() {
      glowX += (cursorX - glowX) * glowLerp;
      glowY += (cursorY - glowY) * glowLerp;
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
      requestAnimationFrame(animateCursorGlow);
    }
    requestAnimationFrame(animateCursorGlow);
  }

  /* -------------------------------------------------
     4. NAVBAR SCROLL EFFECT
     ------------------------------------------------- */
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (!navbar) return;
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  /* -------------------------------------------------
     5. ACTIVE NAV LINK
     ------------------------------------------------- */
  const sections = document.querySelectorAll(
    '#hero, #about, #mission-vision, #products, #global-presence, #certifications, #why-choose-us, #contact'
  );
  const navLinks = document.querySelectorAll('.nav-links a');

  function clearActiveLinks() {
    navLinks.forEach(function (link) { link.classList.remove('active'); });
  }

  if (sections.length > 0 && navLinks.length > 0) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            clearActiveLinks();
            const id = entry.target.getAttribute('id');
            const correspondingLink = document.querySelector('.nav-links a[href="#' + id + '"]');
            if (correspondingLink) correspondingLink.classList.add('active');
          }
        });
      },
      { root: null, rootMargin: '0px 0px -60% 0px', threshold: 0.1 }
    );
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* -------------------------------------------------
     6. HAMBURGER MENU
     ------------------------------------------------- */
  const hamburger = document.querySelector('.hamburger');
  const navLinksContainer = document.querySelector('.nav-links');

  if (hamburger && navLinksContainer) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      navLinksContainer.classList.toggle('active');
    });
    navLinksContainer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        navLinksContainer.classList.remove('active');
      });
    });
  }

  /* -------------------------------------------------
     7. SMOOTH SCROLL
     ------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* -------------------------------------------------
     8. PRODUCT MODALS
     ------------------------------------------------- */
  const productData = {
    'rabihin-dsr': {
      name: 'Rabihin-DSR',
      image: 'images/products/Rabihin-dsr-img.PNG',
      category: 'Gastroenterology',
      tagline: 'Advanced Gastric Acid Control',
      composition: 'Enteric Coated Rabeprazole Sodium & Domperidone SR Capsules',
      description:
        'Rabihin-DSR is a premium dual-action capsule combining Rabeprazole Sodium with Domperidone in sustained-release form. Designed for effective management of gastroesophageal reflux disease (GERD), peptic ulcers, and associated nausea. The enteric coating ensures targeted release for maximum bioavailability.',
      benefits: [
        'Rapid and sustained gastric acid suppression',
        'Effective acid reflux relief and heartburn control',
        'Enhanced digestive support with Domperidone SR',
        'Enteric coated for optimal drug release and absorption',
        'Well-tolerated with minimal side effects',
      ],
      icon: '💊',
    },
    'hincure-ointment': {
      name: 'Hincure Ayurvedic Ointment',
      image: 'images/products/ointment-img.PNG',
      category: 'Ayurvedic / Topical',
      tagline: 'Traditional Healing, Modern Science',
      composition: 'Traditional Ayurvedic Herbal Formula',
      description:
        "Hincure Ayurvedic Ointment is a meticulously formulated topical remedy rooted in centuries-old Ayurvedic wisdom. Crafted from a synergistic blend of natural herbs and botanicals, this multipurpose ointment is designed to promote skin healing, soothe irritation, and support the body's natural repair processes.",
      benefits: [
        'Accelerated skin healing with natural herbal ingredients',
        'Soothes irritation, redness, and inflammation',
        '100% natural Ayurvedic formulation — no harsh chemicals',
        'Multipurpose ointment for cuts, burns, rashes, and dryness',
        'Safe for regular use across all skin types',
      ],
      icon: '🌿',
    },
    'joint-h': {
      name: 'Joint-H Nutraceuticals',
      image: 'images/products/joint-H-img.PNG',
      category: 'Nutraceutical / Orthopedic',
      tagline: 'Move Freely, Live Fully',
      composition: 'Glucosamine, Boswellia Serrata & Domperidone Capsules',
      description:
        'Joint-H is a scientifically advanced nutraceutical supplement formulated to support joint health, reduce discomfort, and improve mobility. Combining the cartilage-building properties of Glucosamine with the potent anti-inflammatory action of Boswellia Serrata, Joint-H delivers comprehensive joint care for an active lifestyle.',
      benefits: [
        'Effective joint pain relief and reduced stiffness',
        'Supports cartilage regeneration with Glucosamine',
        'Natural anti-inflammatory action from Boswellia Serrata',
        'Improved joint mobility and flexibility',
        'Ideal nutraceutical supplement for long-term joint health',
      ],
      icon: '🦴',
    },
  };

  const modalOverlay = document.querySelector('.modal-overlay');
  const modalClose = document.querySelector('.modal-close');
  const productButtons = document.querySelectorAll('.product-btn');

  function openModal(productKey) {
    const product = productData[productKey];
    if (!product || !modalOverlay) return;
    const modalBody = modalOverlay.querySelector('#modal-body');
    if (!modalBody) return;
    let benefitsHTML = '';
    product.benefits.forEach(function (b) { benefitsHTML += '<li>' + b + '</li>'; });
    modalBody.innerHTML =
      '<div style="display: flex; flex-wrap: wrap; gap: 30px; align-items: flex-start;">' +
        '<div style="flex: 1 1 250px; text-align: center;">' +
          '<img src="' + product.image + '" alt="' + product.name + '" style="max-width: 100%; height: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">' +
        '</div>' +
        '<div style="flex: 2 1 300px;">' +
          '<div class="modal-header" style="margin-bottom: 20px;">' +
            '<span class="modal-icon">' + product.icon + '</span>' +
            '<div><span class="modal-category">' + product.category + '</span>' +
            '<h2 style="margin: 0 0 5px 0;">' + product.name + '</h2>' +
            '<p class="modal-tagline" style="margin: 0;">' + product.tagline + '</p></div>' +
          '</div>' +
          '<div class="modal-details">' +
            '<div class="modal-composition"><strong>Composition:</strong> ' + product.composition + '</div>' +
            '<p class="modal-description">' + product.description + '</p>' +
            '<h3>Key Benefits</h3>' +
            '<ul class="modal-benefits">' + benefitsHTML + '</ul>' +
          '</div>' +
        '</div>' +
      '</div>';
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  productButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const card = btn.closest('.product-card');
      const productKey = card ? card.getAttribute('data-product') : btn.getAttribute('data-product');
      if (productKey) openModal(productKey);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);

  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* -------------------------------------------------
     9. CONTACT FORM — Enhanced with Validation & FormSubmit.co
     ------------------------------------------------- */
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    var formCooldown = false;

    /* ---- Validation Helpers ---- */
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function clearFieldErrors() {
      contactForm.querySelectorAll('.input-error').forEach(function (el) {
        el.classList.remove('input-error');
      });
      contactForm.querySelectorAll('.field-error').forEach(function (el) {
        el.remove();
      });
    }

    function showFieldError(fieldId, message) {
      var field = document.getElementById(fieldId);
      if (!field) return;
      field.classList.add('input-error');
      var errSpan = document.createElement('span');
      errSpan.className = 'field-error';
      errSpan.textContent = message;
      field.parentNode.appendChild(errSpan);
    }

    function validateForm() {
      clearFieldErrors();
      var valid = true;
      var nameVal = document.getElementById('name').value.trim();
      var emailVal = document.getElementById('email').value.trim();
      var subjectEl = document.getElementById('subject');
      var messageVal = document.getElementById('message').value.trim();

      if (!nameVal) {
        showFieldError('name', 'Please enter your name');
        valid = false;
      }
      if (!emailVal) {
        showFieldError('email', 'Please enter your email address');
        valid = false;
      } else if (!isValidEmail(emailVal)) {
        showFieldError('email', 'Please enter a valid email address');
        valid = false;
      }
      if (subjectEl && !subjectEl.value) {
        showFieldError('subject', 'Please select an inquiry type');
        valid = false;
      }
      if (!messageVal) {
        showFieldError('message', 'Please enter your message');
        valid = false;
      } else if (messageVal.length < 10) {
        showFieldError('message', 'Message must be at least 10 characters');
        valid = false;
      }
      return valid;
    }

    /* ---- Feedback Message ---- */
    function showFeedback(type, message) {
      var feedback = document.getElementById('form-feedback');
      if (!feedback) return;
      var icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
      feedback.className = 'form-feedback show ' + type;
      feedback.innerHTML = '<i class="fas ' + icon + '"></i> ' + message;
    }

    function hideFeedback() {
      var feedback = document.getElementById('form-feedback');
      if (feedback) {
        feedback.className = 'form-feedback';
        feedback.innerHTML = '';
      }
    }

    /* ---- Button States ---- */
    function setButtonLoading(btn, loading) {
      if (loading) {
        btn.classList.add('loading');
        btn.disabled = true;
      } else {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    }

    /* ---- Clear errors on input ---- */
    contactForm.querySelectorAll('input, textarea, select').forEach(function (field) {
      field.addEventListener('input', function () {
        this.classList.remove('input-error');
        var errEl = this.parentNode.querySelector('.field-error');
        if (errEl) errEl.remove();
      });
      field.addEventListener('change', function () {
        this.classList.remove('input-error');
        var errEl = this.parentNode.querySelector('.field-error');
        if (errEl) errEl.remove();
      });
    });

    /* ---- Form Submit Handler ---- */
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideFeedback();

      // Cooldown check
      if (formCooldown) {
        showFeedback('error', 'Please wait 30 seconds before submitting again.');
        return;
      }

      // Validate
      if (!validateForm()) {
        showFeedback('error', 'Please fix the errors above and try again.');
        return;
      }

      var submitBtn = document.getElementById('contact-submit-btn');
      setButtonLoading(submitBtn, true);

      var formData = new FormData(contactForm);
      // Set reply-to so you can directly reply to the sender from your email
      formData.append('_replyto', document.getElementById('email').value.trim());

      fetch("https://formsubmit.co/ajax/hindvahealthcare@gmail.com", {
        method: "POST",
        headers: { 'Accept': 'application/json' },
        body: formData
      })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        if (data.success === 'false' || data.success === false) {
          throw new Error(data.message || 'Submission was rejected.');
        }

        // Success
        showFeedback('success', 'Message sent successfully! We\'ll get back to you within 24 hours. A confirmation email has been sent to your inbox.');
        contactForm.reset();
        setButtonLoading(submitBtn, false);

        // Cooldown — prevent duplicate submissions for 30 seconds
        formCooldown = true;
        submitBtn.disabled = true;
        setTimeout(function () {
          formCooldown = false;
          submitBtn.disabled = false;
        }, 30000);

        // Auto-hide success message after 8 seconds
        setTimeout(function () { hideFeedback(); }, 8000);
      })
      .catch(function (error) {
        console.error('Contact form error:', error);
        setButtonLoading(submitBtn, false);
        showFeedback('error', 'Could not send your message. Please try again, or email us directly at hindvahealthcare@gmail.com');
      });
    });
  }


  /* -------------------------------------------------
     10. HERO MOUSE-FOLLOW GRADIENT (DISABLED)
     ------------------------------------------------- 
     Disabled because it overwrites the hero-bg.png image 
     with a solid gradient when the mouse moves.
  */
  const heroSection = document.getElementById('hero');

  if (heroSection && !isTouchDevice) {
    // Keep tracking mouse position in CSS variables just in case other elements need it,
    // but DO NOT overwrite the background property so the image stays visible.
    heroSection.addEventListener('mousemove', function (e) {
      const rect = heroSection.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      heroSection.style.setProperty('--mouse-x', x + '%');
      heroSection.style.setProperty('--mouse-y', y + '%');
    });
  }
})();
