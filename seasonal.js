/* Seasonal themes: the moving (or, with reduced motion, still) picture behind the page.

   settings.js decides which theme is in effect and puts it on <html> as data-season
   ("fireworks" or "christmas", absent = none). This file only draws it:
   a fixed, click-through <canvas> behind everything (styles.css: .season-canvas).

   - Fireworks: rockets rise and burst into sparks.
   - Christmas: snow drifts down.
   - Reduced motion (the device setting or the Settings page): one still frame, nothing moves.
   - Nothing runs while the tab is hidden (requestAnimationFrame pauses) and nothing is drawn
     when there is no seasonal theme: the canvas is removed.

   Written as one closure so its names can't clash with the site's other scripts. */

(() => {
  const TAU = Math.PI * 2;
  // Everything random goes through random(), so a preview's still picture can be made the same every time
  // (see mountSeasonPreview). Normal use is Math.random.
  let random = Math.random;
  const seeded = seed => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rand = (min, max) => min + random() * (max - min);
  const pick = list => list[Math.floor(random() * list.length)];

  // Sparks need to glow on dark themes and to be dark and saturated enough to read on the light one.
  const SPARK_COLOURS = {
    dark:  ['#ff5d73', '#ffd166', '#7ee081', '#5ec8ff', '#c792ff', '#ff9ee5', '#ffffff'],
    light: ['#d81e44', '#b87400', '#1b8f43', '#0a78c2', '#7a3fe0', '#c0239e', '#1b2540']
  };
  const SNOW_COLOURS = { dark: '255, 255, 255', light: '96, 132, 190' };

  const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

  /* ---------- Fireworks ---------- */

  function createFireworks(view) {
    const rockets = [];
    const sparks = [];
    let untilLaunch = 0.2; // the first rocket goes almost at once so a new choice is seen straight away

    const scale = () => view.scale ?? Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const line = () => view.line ?? 1; // thinner strokes on the small preview tiles

    function launch() {
      const x = rand(view.w * 0.12, view.w * 0.88);
      const targetY = rand(view.h * 0.14, view.h * 0.5);
      const riseTime = rand(0.9, 1.3); // seconds from the bottom edge to the burst
      rockets.push({
        x, y: view.h + 4, px: x, py: view.h + 4,
        vx: rand(-30, 30) * scale(), vy: -(view.h + 4 - targetY) / riseTime, targetY
      });
    }

    function burst(x, y) {
      const colours = SPARK_COLOURS[isLight() ? 'light' : 'dark'];
      const main = pick(colours);
      const second = random() < 0.4 ? pick(colours) : main;
      const count = Math.round(rand(46, 70));
      const power = rand(110, 190) * scale();
      const ring = random() < 0.3; // some bursts are a clean ring instead of a ball
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * TAU + rand(-0.04, 0.04);
        const speed = ring ? power : power * Math.sqrt(random());
        sparks.push({
          x, y, px: x, py: y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          age: 0, life: rand(1.1, 1.8),
          colour: i % 2 ? main : second
        });
      }
    }

    function step(dt) {
      untilLaunch -= dt;
      if (untilLaunch <= 0 && rockets.length < 3) {
        launch();
        untilLaunch = rand(0.7, 1.6);
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.px = r.x; r.py = r.y;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        if (r.y <= r.targetY) {
          burst(r.x, r.y);
          rockets.splice(i, 1);
        }
      }

      const drag = Math.pow(0.97, dt * 60);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.age += dt;
        if (p.age >= p.life) { sparks.splice(i, 1); continue; }
        p.px = p.x; p.py = p.y;
        p.vx *= drag;
        p.vy = p.vy * drag + (view.scale ? 70 * view.scale : 70) * dt; // gravity
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }

    function draw(ctx) {
      const light = isLight();
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      ctx.lineCap = 'round';

      ctx.lineWidth = 2.5 * line();
      ctx.strokeStyle = light ? '#b87400' : '#ffe9b0';
      ctx.globalAlpha = 0.9;
      rockets.forEach(r => {
        ctx.beginPath();
        ctx.moveTo(r.px - r.vx * 0.04, r.py - r.vy * 0.04);
        ctx.lineTo(r.x, r.y);
        ctx.stroke();
      });

      ctx.lineWidth = 2 * line();
      sparks.forEach(p => {
        const left = 1 - p.age / p.life;
        ctx.globalAlpha = Math.min(1, left * 1.6) * (light ? 0.85 : 1);
        ctx.strokeStyle = p.colour;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // One frame for reduced motion: a few bursts caught partway through.
    function still() {
      const spots = [[0.2, 0.28], [0.52, 0.18], [0.8, 0.34], [0.36, 0.52], [0.7, 0.58]];
      spots.forEach(([fx, fy]) => burst(view.w * fx, view.h * fy));
      sparks.forEach(p => {
        p.age = p.life * 0.25;
        p.x += p.vx * 0.3; p.y += p.vy * 0.3;
        p.vx = p.vx * 0.6; p.vy = p.vy * 0.6;
      });
    }

    return { step, draw, still, resize() {} };
  }

  /* ---------- Christmas ---------- */

  function createSnow(view) {
    let flakes = [];

    const wanted = () => view.flakes ?? Math.round(Math.min(150, Math.max(36, (view.w * view.h) / 11000)));

    function flake(anywhere) {
      const size = rand(1.2, 3.6) * (view.line ?? 1);
      return {
        x: rand(0, view.w),
        y: anywhere ? rand(0, view.h) : rand(-20, -2),
        size,
        fall: rand(22, 38) + size * 9, // bigger flakes are nearer, so they fall faster
        sway: rand(6, 22), swaySpeed: rand(0.4, 1.1), phase: rand(0, TAU),
        alpha: rand(0.45, 0.9)
      };
    }

    function fill(anywhere) {
      const count = wanted();
      while (flakes.length < count) flakes.push(flake(anywhere));
      if (flakes.length > count) flakes.length = count;
    }

    let clock = 0;
    function step(dt) {
      clock += dt;
      fill(false);
      flakes.forEach(f => {
        f.y += f.fall * dt;
        f.x += Math.sin(clock * f.swaySpeed + f.phase) * f.sway * dt;
        if (f.y > view.h + 6) { f.y = rand(-20, -2); f.x = rand(0, view.w); }
        if (f.x < -8) f.x = view.w + 8; else if (f.x > view.w + 8) f.x = -8;
      });
    }

    function draw(ctx) {
      const rgb = SNOW_COLOURS[isLight() ? 'light' : 'dark'];
      flakes.forEach(f => {
        ctx.fillStyle = `rgba(${rgb}, ${f.alpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, TAU);
        ctx.fill();
      });
    }

    function still() { flakes = []; fill(true); }

    // Start with flakes already spread over the whole screen; otherwise they would all begin above
    // the top edge and the page would be empty until the first ones had fallen into view.
    fill(true);

    // A resized window keeps its flakes, spread over the new size.
    function resize(oldW, oldH) {
      if (!oldW || !oldH) return;
      flakes.forEach(f => { f.x = (f.x / oldW) * view.w; f.y = (f.y / oldH) * view.h; });
    }

    return { step, draw, still, resize };
  }

  const EFFECTS = { fireworks: createFireworks, christmas: createSnow };

  /* ---------- Running ---------- */

  const view = { w: 0, h: 0, dpr: 1 };
  let canvas = null;
  let ctx = null;
  let effect = null;
  let frame = 0;
  let lastTime = 0;
  let mode = ''; // what is running now: season, motion and (for a still frame) theme
  let resizeTimer = 0;

  function fitCanvas() {
    const oldW = view.w;
    const oldH = view.h;
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.w = window.innerWidth;
    view.h = window.innerHeight;
    canvas.width = Math.round(view.w * view.dpr);
    canvas.height = Math.round(view.h * view.dpr);
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    if (effect) effect.resize(oldW, oldH);
  }

  function clear() { ctx.clearRect(0, 0, view.w, view.h); }

  function tick(time) {
    const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
    lastTime = time;
    effect.step(dt);
    clear();
    effect.draw(ctx);
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    clearTimeout(resizeTimer);
    window.removeEventListener('resize', onResize);
    if (canvas) canvas.remove();
    canvas = ctx = effect = null;
    mode = '';
  }

  function drawStill() {
    effect = EFFECTS[canvas.dataset.season](view);
    effect.still();
    clear();
    effect.draw(ctx);
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!canvas) return;
      fitCanvas();
      if (!frame) drawStill(); // a still frame is drawn again at the new size
    }, 120);
  }

  function update() {
    const season = document.documentElement.getAttribute('data-season');
    const reduced = typeof prefersReducedMotion === 'function' && prefersReducedMotion();
    const next = EFFECTS[season] ? [season, reduced ? 'still-' + (isLight() ? 'light' : 'dark') : 'moving'].join('|') : '';
    if (next === mode) return;

    const sameSeason = canvas && canvas.dataset.season === season;
    if (!next) { stop(); return; }

    cancelAnimationFrame(frame);
    frame = 0;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'season-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
      ctx = canvas.getContext('2d');
      if (!ctx) { stop(); return; }
      window.addEventListener('resize', onResize);
    }
    canvas.dataset.season = season;
    mode = next;
    if (!sameSeason || !effect) fitCanvas();

    if (reduced) {
      drawStill();
    } else {
      // Keep the picture already on screen when only the motion setting changed.
      if (!sameSeason || !effect) effect = EFFECTS[season](view);
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  if (document.body) update();
  else document.addEventListener('DOMContentLoaded', update);
  document.addEventListener(SETTINGS_EVENT, update);

  /* ---------- Previews on the Settings page ---------- */

  /* Shows one effect, smaller, in a canvas on the Settings page (the cards of the seasonal theme setting).
     Same code as the page background, so what the card shows is what is switched on. It is a still
     picture until the pointer is over its card (or the card has keyboard focus), then it moves; with
     reduced motion it never moves. Looks after itself; returns nothing. */
  window.mountSeasonPreview = (previewCanvas, season) => {
    const pctx = previewCanvas.getContext('2d');
    const pview = { w: 0, h: 0, dpr: 1, scale: 0.3, line: 0.6, flakes: 14 };
    let peffect = null;
    let pframe = 0;
    let plast = 0;
    let onScreen = false;
    let active = false; // pointer over, or focus inside, the card
    let bound = false;

    function fit() {
      const box = previewCanvas.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      const oldW = pview.w;
      const oldH = pview.h;
      pview.dpr = Math.min(window.devicePixelRatio || 1, 2);
      pview.w = box.width;
      pview.h = box.height;
      previewCanvas.width = Math.round(pview.w * pview.dpr);
      previewCanvas.height = Math.round(pview.h * pview.dpr);
      pctx.setTransform(pview.dpr, 0, 0, pview.dpr, 0, 0);
      if (peffect) peffect.resize(oldW, oldH);
      return true;
    }

    const paint = () => { pctx.clearRect(0, 0, pview.w, pview.h); peffect.draw(pctx); };

    // The same picture every time (seeded), so it never changes behind the person's back: not when they
    // choose a card, and not when the pointer leaves again.
    function showStill() {
      random = seeded(season === 'fireworks' ? 11 : 5);
      try {
        peffect = EFFECTS[season](pview);
        peffect.still();
      } finally { random = Math.random; }
      paint();
    }

    function frameLoop(time) {
      const dt = Math.min(0.05, (time - plast) / 1000 || 0);
      plast = time;
      peffect.step(dt);
      paint();
      pframe = requestAnimationFrame(frameLoop);
    }

    function run() {
      cancelAnimationFrame(pframe);
      pframe = 0;
      if (!onScreen || !pview.w) return;
      const reduced = typeof prefersReducedMotion === 'function' && prefersReducedMotion();
      if (active && !reduced) {
        if (!peffect) showStill(); // carries on from the still picture
        plast = performance.now();
        pframe = requestAnimationFrame(frameLoop);
      } else {
        showStill();
      }
    }

    function setActive(on) {
      if (active === on) return;
      active = on;
      run();
    }

    new IntersectionObserver(entries => {
      onScreen = entries[entries.length - 1].isIntersecting;
      if (onScreen && !pview.w) fit();
      if (!bound) {
        // The card is the label around the preview; it only exists once the page has put the canvas in it.
        const card = previewCanvas.closest('.choice');
        if (card) {
          bound = true;
          // Focus from a mouse click on the card doesn't count; only keyboard focus does.
          const keyboardFocus = () => !!card.querySelector('input:focus-visible');
          card.addEventListener('pointerenter', () => setActive(true));
          card.addEventListener('pointerleave', () => setActive(keyboardFocus()));
          card.addEventListener('focusin', () => setActive(keyboardFocus() || card.matches(':hover')));
          card.addEventListener('focusout', () => setActive(card.matches(':hover')));
        }
      }
      run();
    }).observe(previewCanvas);

    new ResizeObserver(() => { if (fit() && !pframe) run(); }).observe(previewCanvas);

    // Only a change to what the picture depends on touches it; any other setting (including choosing
    // one of these cards) leaves it exactly as it is, rather than drawing a different random frame.
    const look = () => [isLight(), typeof prefersReducedMotion === 'function' && prefersReducedMotion()];
    let lastLook = look();
    document.addEventListener(SETTINGS_EVENT, () => {
      const now = look();
      const [wasLight, wasReduced] = lastLook;
      lastLook = now;
      if (now[1] !== wasReduced) { peffect = null; run(); }          // motion on/off: stop, or allow, moving
      else if (now[0] !== wasLight && peffect && !pframe) paint();  // light/dark: same picture, new colours
    });
  };
})();
