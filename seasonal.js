/* Seasonal themes: the moving (or, with reduced motion, still) picture behind the page.

   settings.js decides which theme is in effect and puts it on <html> as data-season
   ("fireworks", "snowfall", "christmas", "halloween" or "friday13", absent = none). This file only draws it:
   a fixed, click-through <canvas> behind everything (styles.css: .season-canvas).

   - Fireworks: rockets rise and burst into sparks.
   - Snowfall: snow drifts down.
   - Christmas: a string of fairy lights twinkles along the top while golden sparkles drift down.
   - Halloween: bats flap across a hazy moon while embers rise from a warm glow at the bottom.
   - Friday 13th: mist drifts across, faint "13"s float up and fade, and every several seconds a
     branching lightning bolt strikes down from the top and fades with a soft glow (one smooth
     strike, never a flicker).
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

  /* ---------- Snowfall ---------- */

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

  /* ---------- Friday 13th ---------- */

  // Mist and lightning colours as "r, g, b"; the light theme needs darker, duller ones to show at all.
  const MIST_COLOURS = { dark: '150, 110, 225', light: '88, 60, 150' };
  const GLYPH_COLOURS = { dark: '205, 185, 255', light: '70, 45, 130' };
  const FLASH_COLOURS = { dark: '190, 170, 255', light: '70, 50, 130' };
  const FLASH_TIME = 1.6; // seconds for a whole strike: a quick swell, then a slow fade
  const STRIKE_TIME = 0.16; // seconds the bolt takes to reach the ground

  function createFriday13(view) {
    let mist = [];
    let glyphs = [];
    let clock = 0;
    let untilFlash = 3;   // the first one comes soon, so a new choice is seen to do something
    let flashAge = FLASH_TIME; // = no flash showing
    let flashX = 0.5;
    let bolt = []; // the strike showing now: paths of points, each starting after a short delay

    const unit = () => view.scale ?? Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const wantedMist = () => view.mist ?? 6;
    const wantedGlyphs = () => view.glyphs ?? Math.round(Math.min(18, Math.max(5, (view.w * view.h) / 70000)));

    function wisp() {
      return {
        x: rand(0, view.w), y: rand(view.h * 0.2, view.h * 1.05),
        r: Math.max(view.w, view.h) * rand(0.22, 0.4),
        vx: rand(5, 14) * unit() * (random() < 0.5 ? -1 : 1),
        alpha: rand(0.07, 0.13), swaySpeed: rand(0.15, 0.4), phase: rand(0, TAU)
      };
    }

    function glyph(anywhere) {
      const life = rand(7, 12);
      return {
        x: rand(view.w * 0.04, view.w * 0.96), y: anywhere ? rand(view.h * 0.1, view.h) : rand(view.h * 0.7, view.h + 20),
        size: rand(16, 40) * unit(), rise: rand(8, 20) * unit(),
        sway: rand(4, 14), swaySpeed: rand(0.3, 0.8), phase: rand(0, TAU),
        tilt: rand(-0.35, 0.35), age: anywhere ? rand(0, life) : 0, life, peak: rand(0.18, 0.38)
      };
    }

    // A jagged path from (x, y) heading down to endY, wandering sideways; lean pushes it one way.
    function jagged(x, y, endY, lean, segment) {
      const pts = [[x, y]];
      while (y < endY) {
        y = Math.min(endY, y + segment * rand(0.6, 1.4));
        x += rand(-1, 1) * segment * 0.7 + lean * segment * 0.25;
        pts.push([x, y]);
      }
      return pts;
    }

    // A bolt from the top edge with a few side branches that start a moment after the point they split from.
    function makeBolt(x) {
      const segment = Math.max(6, view.h / 20);
      const main = jagged(x, -4, view.h * rand(0.5, 0.85), rand(-0.6, 0.6), segment);
      const paths = [{ pts: main, delay: 0, width: 1 }];
      const branches = Math.round(rand(2, 4));
      for (let i = 0; i < branches; i++) {
        const at = Math.floor(rand(2, main.length - 2));
        const [bx, by] = main[at];
        const pts = jagged(bx, by, Math.min(view.h, by + view.h * rand(0.15, 0.3)), (random() < 0.5 ? -1 : 1) * rand(0.8, 1.6), segment * 0.8);
        paths.push({ pts, delay: (at / (main.length - 1)) * STRIKE_TIME, width: 0.55 });
      }
      return paths;
    }

    function fill(anywhere) {
      while (mist.length < wantedMist()) mist.push(wisp());
      if (mist.length > wantedMist()) mist.length = wantedMist();
      while (glyphs.length < wantedGlyphs()) glyphs.push(glyph(anywhere));
      if (glyphs.length > wantedGlyphs()) glyphs.length = wantedGlyphs();
    }

    function step(dt) {
      clock += dt;
      fill(false);
      mist.forEach(m => {
        m.x += m.vx * dt;
        if (m.vx > 0 && m.x - m.r > view.w) m.x = -m.r;
        else if (m.vx < 0 && m.x + m.r < 0) m.x = view.w + m.r;
      });
      for (let i = 0; i < glyphs.length; i++) {
        const g = glyphs[i];
        g.age += dt;
        g.y -= g.rise * dt;
        if (g.age >= g.life) glyphs[i] = glyph(false);
      }
      untilFlash -= dt;
      if (untilFlash <= 0) { flashAge = 0; flashX = rand(0.15, 0.85); bolt = makeBolt(view.w * flashX); untilFlash = rand(8, 15); }
      if (flashAge < FLASH_TIME) flashAge += dt;
    }

    // 0 to 1: up in a quarter of a second, then down slowly. Gentle on purpose (no strobing).
    const flashLevel = () => {
      if (flashAge >= FLASH_TIME) return 0;
      const t = flashAge / FLASH_TIME;
      return t < 0.15 ? t / 0.15 : Math.pow(1 - (t - 0.15) / 0.85, 2);
    };

    // Draws the part of each path the strike has reached so far, as a wide soft glow under a thin bright core.
    function drawBolt(ctx, light, level) {
      if (!bolt.length) return;
      const rgb = FLASH_COLOURS[light ? 'light' : 'dark'];
      const core = light ? '56, 36, 112' : '245, 238, 255';
      const unitLine = view.line ?? 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      [[11, rgb, 0.3], [3, core, 0.95]].forEach(([width, colour, alpha]) => {
        ctx.strokeStyle = `rgba(${colour}, ${(alpha * level).toFixed(3)})`;
        bolt.forEach(path => {
          const reached = Math.min(1, Math.max(0, (flashAge - path.delay) / STRIKE_TIME));
          if (reached <= 0) return;
          const last = (path.pts.length - 1) * reached;
          ctx.lineWidth = Math.max(0.6, width * path.width * unitLine * (view.scale ? 1 : 0.9));
          ctx.beginPath();
          ctx.moveTo(path.pts[0][0], path.pts[0][1]);
          for (let i = 1; i <= Math.floor(last); i++) ctx.lineTo(path.pts[i][0], path.pts[i][1]);
          const whole = Math.floor(last);
          if (whole < path.pts.length - 1) {
            const a = path.pts[whole];
            const b = path.pts[whole + 1];
            const f = last - whole;
            ctx.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
          }
          ctx.stroke();
        });
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    function draw(ctx) {
      const light = isLight();

      const mistRgb = MIST_COLOURS[light ? 'light' : 'dark'];
      mist.forEach(m => {
        const y = m.y + Math.sin(clock * m.swaySpeed + m.phase) * m.r * 0.12;
        const grad = ctx.createRadialGradient(m.x, y, 0, m.x, y, m.r);
        grad.addColorStop(0, `rgba(${mistRgb}, ${m.alpha * (light ? 0.8 : 1)})`);
        grad.addColorStop(1, `rgba(${mistRgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(m.x - m.r, y - m.r, m.r * 2, m.r * 2);
      });

      const glyphRgb = GLYPH_COLOURS[light ? 'light' : 'dark'];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      glyphs.forEach(g => {
        const fade = Math.sin(Math.PI * Math.min(1, g.age / g.life)); // in, then out
        if (fade <= 0.01) return;
        ctx.save();
        ctx.translate(g.x + Math.sin(clock * g.swaySpeed + g.phase) * g.sway, g.y);
        ctx.rotate(g.tilt);
        ctx.font = `700 ${g.size.toFixed(1)}px Minercraftory, Inter, sans-serif`;
        ctx.fillStyle = `rgba(${glyphRgb}, ${(g.peak * fade * (light ? 0.8 : 1)).toFixed(3)})`;
        ctx.fillText('13', 0, 0);
        ctx.restore();
      });

      const level = flashLevel();
      if (level > 0) {
        drawBolt(ctx, light, level);
        const flashRgb = FLASH_COLOURS[light ? 'light' : 'dark'];
        const reach = Math.max(view.w, view.h) * 0.9;
        const x = view.w * flashX;
        const grad = ctx.createRadialGradient(x, 0, 0, x, 0, reach);
        grad.addColorStop(0, `rgba(${flashRgb}, ${(0.2 * level).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${flashRgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, view.w, view.h);
      }
    }

    // One frame for reduced motion: mist and a scatter of 13s, no lightning.
    function still() {
      mist = []; glyphs = [];
      fill(true);
      glyphs.forEach(g => { g.age = g.life * rand(0.3, 0.7); });
      flashX = 0.68;
      bolt = makeBolt(view.w * flashX);
      flashAge = 0.35; // reduced motion still gets the picture, caught as it fades
      untilFlash = Infinity;
    }

    fill(true);

    // A resized window keeps its mist and numbers, spread over the new size.
    function resize(oldW, oldH) {
      if (!oldW || !oldH) return;
      mist.forEach(m => { m.x = (m.x / oldW) * view.w; m.y = (m.y / oldH) * view.h; m.r = Math.max(view.w, view.h) * (m.r / Math.max(oldW, oldH)); });
      glyphs.forEach(g => { g.x = (g.x / oldW) * view.w; g.y = (g.y / oldH) * view.h; });
    }

    return { step, draw, still, resize };
  }

  /* ---------- Christmas ---------- */

  const LIGHT_COLOURS = { dark: SPARK_COLOURS.dark.slice(0, 4), light: SPARK_COLOURS.light.slice(0, 4) };
  const SPARKLE_COLOURS = { dark: '255, 236, 170', light: '201, 138, 0' };

  function createChristmas(view) {
    let sparkles = [];
    let clock = 0;

    const unit = () => view.scale ?? Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const wantedSparkles = () => view.sparkles ?? Math.round(Math.min(26, Math.max(7, (view.w * view.h) / 38000)));

    function sparkle(anywhere) {
      const life = rand(5, 9);
      return {
        x: rand(0, view.w), y: anywhere ? rand(0, view.h) : rand(-10, view.h * 0.2),
        size: rand(3, 8) * unit(), fall: rand(5, 14) * unit(),
        sway: rand(4, 12), swaySpeed: rand(0.3, 0.7), phase: rand(0, TAU),
        twinkle: rand(0.8, 1.6), age: anywhere ? rand(0, life) : 0, life
      };
    }

    function fill(anywhere) {
      while (sparkles.length < wantedSparkles()) sparkles.push(sparkle(anywhere));
      if (sparkles.length > wantedSparkles()) sparkles.length = wantedSparkles();
    }

    function step(dt) {
      clock += dt;
      fill(false);
      for (let i = 0; i < sparkles.length; i++) {
        const p = sparkles[i];
        p.age += dt;
        p.y += p.fall * dt;
        if (p.age >= p.life || p.y > view.h + 10) sparkles[i] = sparkle(false);
      }
    }

    // A four-pointed star, drawn as four curves pinched in to the middle.
    function star(ctx, x, y, r) {
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fill();
    }

    // The page's sticky header covers the top of the canvas, so the string hangs from just below it (the small
    // previews have no header and set lightsTop to 0).
    const headerBottom = () => {
      const header = document.getElementById('site-header');
      return header ? Math.min(view.h * 0.3, Math.max(0, header.getBoundingClientRect().bottom)) : 0;
    };

    // The string: swags of wire hung across the top edge, a bulb every so often along each one. The
    // positions come straight from the view size, so a resize needs no bookkeeping.
    function drawLights(ctx, light) {
      const u = unit();
      const colours = LIGHT_COLOURS[light ? 'light' : 'dark'];
      const arcs = Math.max(2, Math.round(view.w / Math.max(160 * u, 120)));
      const arcWidth = view.w / arcs;
      const sag = Math.min(view.h * 0.1, 30 * u + 8);
      const top = (view.lightsTop ?? headerBottom()) + Math.max(1, 2 * u);
      const spacing = Math.max(7, 40 * u);
      const radius = Math.max(1.4, 4 * u);
      const glow = radius * 4.5;
      let index = 0;
      const bulbs = [];

      ctx.lineWidth = Math.max(0.6, 1.4 * u);
      ctx.strokeStyle = light ? 'rgba(30, 36, 58, 0.45)' : 'rgba(210, 220, 245, 0.22)';
      for (let a = 0; a < arcs; a++) {
        const x0 = a * arcWidth;
        const x1 = x0 + arcWidth;
        ctx.beginPath();
        ctx.moveTo(x0, top);
        ctx.quadraticCurveTo((x0 + x1) / 2, top + sag * 2, x1, top);
        ctx.stroke();
        const count = Math.max(2, Math.round(arcWidth / spacing));
        for (let i = 1; i < count; i++) {
          const t = i / count;
          const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
          const py = (1 - t) * (1 - t) * top + 2 * (1 - t) * t * (top + sag * 2) + t * t * top;
          bulbs.push([px, py + radius * 1.4, index++]);
        }
      }

      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      bulbs.forEach(([x, y, i]) => {
        const colour = colours[i % colours.length];
        // slow, smooth swell and fade: a bulb takes several seconds to go from bright to dim
        const level = 0.6 + 0.4 * Math.sin(clock * (0.7 + (i % 5) * 0.17) + i * 2.4);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, glow);
        grad.addColorStop(0, colour);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = (light ? 0.3 : 0.42) * level;
        ctx.fillStyle = grad;
        ctx.fillRect(x - glow, y - glow, glow * 2, glow * 2);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      bulbs.forEach(([x, y, i]) => {
        const level = 0.6 + 0.4 * Math.sin(clock * (0.7 + (i % 5) * 0.17) + i * 2.4);
        ctx.fillStyle = colours[i % colours.length];
        ctx.globalAlpha = 0.55 + 0.45 * level;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function draw(ctx) {
      const light = isLight();
      drawLights(ctx, light);

      const rgb = SPARKLE_COLOURS[light ? 'light' : 'dark'];
      sparkles.forEach(p => {
        const fade = Math.sin(Math.PI * Math.min(1, p.age / p.life));
        const twinkle = 0.55 + 0.45 * Math.sin(clock * p.twinkle * 2 + p.phase);
        ctx.fillStyle = `rgba(${rgb}, ${(fade * twinkle * (light ? 0.8 : 0.95)).toFixed(3)})`;
        star(ctx, p.x + Math.sin(clock * p.swaySpeed + p.phase) * p.sway, p.y, p.size * (0.7 + 0.3 * twinkle));
      });
    }

    // One frame for reduced motion: the lights part-way through their glow and sparkles scattered about.
    function still() {
      sparkles = [];
      fill(true);
      clock = 3;
    }

    fill(true);

    function resize(oldW, oldH) {
      if (!oldW || !oldH) return;
      sparkles.forEach(p => { p.x = (p.x / oldW) * view.w; p.y = (p.y / oldH) * view.h; });
    }

    return { step, draw, still, resize };
  }

  /* ---------- Halloween ---------- */

  const EMBER_COLOURS = { dark: '255, 150, 50', light: '214, 100, 20' };

  function createHalloween(view) {
    let bats = [];
    let embers = [];
    let clock = 0;

    const unit = () => view.scale ?? Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const wantedBats = () => view.bats ?? Math.round(Math.min(6, Math.max(2, view.w / 260)));
    const wantedEmbers = () => view.embers ?? Math.round(Math.min(60, Math.max(14, (view.w * view.h) / 14000)));

    function bat(anywhere) {
      const dir = random() < 0.5 ? -1 : 1;
      const size = rand(20, 38) * unit();
      return {
        dir, size,
        x: anywhere ? rand(0, view.w) : (dir > 0 ? -size * 2 : view.w + size * 2),
        y: rand(view.h * 0.08, view.h * 0.6),
        speed: rand(55, 120) * unit(),
        bob: rand(10, 30) * unit(), bobSpeed: rand(0.8, 1.8), phase: rand(0, TAU),
        flapSpeed: rand(14, 20), // radians a second: about 2 to 3 flaps a second, never a flicker
        base: 0
      };
    }

    function ember(anywhere) {
      const life = rand(5, 9);
      return {
        x: rand(0, view.w), y: anywhere ? rand(view.h * 0.2, view.h) : view.h + 6,
        size: rand(0.9, 2.4) * (view.line ?? 1), rise: rand(14, 34) * unit(),
        sway: rand(6, 18), swaySpeed: rand(0.4, 1), phase: rand(0, TAU),
        age: anywhere ? rand(0, life) : 0, life, peak: rand(0.4, 0.9)
      };
    }

    function fill(anywhere) {
      while (bats.length < wantedBats()) bats.push(bat(anywhere));
      if (bats.length > wantedBats()) bats.length = wantedBats();
      while (embers.length < wantedEmbers()) embers.push(ember(anywhere));
      if (embers.length > wantedEmbers()) embers.length = wantedEmbers();
    }

    function step(dt) {
      clock += dt;
      fill(false);
      for (let i = 0; i < bats.length; i++) {
        const b = bats[i];
        b.x += b.dir * b.speed * dt;
        b.base = Math.sin(clock * b.bobSpeed + b.phase) * b.bob;
        if ((b.dir > 0 && b.x > view.w + b.size * 2) || (b.dir < 0 && b.x < -b.size * 2)) bats[i] = bat(false);
      }
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.age += dt;
        e.y -= e.rise * dt;
        if (e.age >= e.life || e.y < -6) embers[i] = ember(false);
      }
    }

    // One bat, facing the way it flies; flap runs from -1 (wings down) to 1 (wings up). Every part is filled on
    // its own: parts drawn as one path cancel each other out where they overlap and leave holes.
    function drawBat(ctx, x, y, s, flap) {
      const tipY = -0.1 * s - 0.55 * s * flap;
      const baseY = 0.1 * s - 0.12 * s * flap;

      [-1, 1].forEach(side => {
        const tip = [side * s, tipY];
        const a = [side * 0.68 * s, baseY + 0.05 * s];
        const b = [side * 0.4 * s, baseY + 0.13 * s];
        const c = [side * 0.08 * s, 0.26 * s];
        // each scallop dips in towards the wing: its control point is lifted above the straight line
        const scallop = (from, to) => ctx.quadraticCurveTo((from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - 0.1 * s, to[0], to[1]);
        ctx.beginPath();
        ctx.moveTo(side * 0.06 * s, -0.12 * s);
        ctx.quadraticCurveTo(side * 0.5 * s, -0.5 * s - 0.35 * s * flap, tip[0], tip[1]);
        scallop(tip, a);
        scallop(a, b);
        scallop(b, c);
        ctx.closePath();
        ctx.fill();
      });

      // body, head and ears
      ctx.beginPath();
      ctx.ellipse(0, 0.06 * s, 0.12 * s, 0.26 * s, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -0.22 * s, 0.11 * s, 0, TAU);
      ctx.fill();
      [-1, 1].forEach(side => {
        ctx.beginPath();
        ctx.moveTo(side * 0.11 * s, -0.24 * s);
        ctx.lineTo(side * 0.09 * s, -0.44 * s);
        ctx.lineTo(side * 0.0 * s, -0.31 * s);
        ctx.closePath();
        ctx.fill();
      });
    }

    function draw(ctx) {
      const light = isLight();
      const glowRgb = EMBER_COLOURS[light ? 'light' : 'dark'];

      // The moon, large and hazy, high on the right (bats cross in front of it): a pale disc with faint
      // craters inside a soft glow of the same colour.
      const mx = view.w * 0.8;
      const my = view.h * 0.22;
      const mr = Math.min(view.w, view.h) * 0.13 + 6;
      const haloRgb = light ? '222, 196, 130' : '255, 243, 210';
      const halo = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 3.2);
      halo.addColorStop(0, `rgba(${haloRgb}, ${light ? 0.34 : 0.2})`);
      halo.addColorStop(1, `rgba(${haloRgb}, 0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(mx - mr * 3.2, my - mr * 3.2, mr * 6.4, mr * 6.4);
      ctx.fillStyle = light ? 'rgba(206, 190, 148, 0.55)' : 'rgba(238, 234, 218, 0.3)';
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, TAU);
      ctx.fill();
      ctx.fillStyle = light ? 'rgba(120, 100, 60, 0.12)' : 'rgba(60, 64, 90, 0.2)';
      [[-0.32, -0.28, 0.2], [0.28, -0.05, 0.14], [-0.1, 0.38, 0.17], [0.38, 0.4, 0.09]].forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(mx + dx * mr, my + dy * mr, r * mr, 0, TAU);
        ctx.fill();
      });

      // A warm glow along the bottom edge, where the embers come from.
      const ground = ctx.createLinearGradient(0, view.h, 0, view.h * 0.55);
      ground.addColorStop(0, `rgba(${glowRgb}, ${light ? 0.16 : 0.2})`);
      ground.addColorStop(1, `rgba(${glowRgb}, 0)`);
      ctx.fillStyle = ground;
      ctx.fillRect(0, view.h * 0.55, view.w, view.h * 0.45);

      embers.forEach(e => {
        const fade = Math.sin(Math.PI * Math.min(1, e.age / e.life));
        const twinkle = 0.75 + 0.25 * Math.sin(clock * 5 + e.phase);
        ctx.fillStyle = `rgba(${glowRgb}, ${(e.peak * fade * twinkle * (light ? 0.8 : 1)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(e.x + Math.sin(clock * e.swaySpeed + e.phase) * e.sway, e.y, e.size, 0, TAU);
        ctx.fill();
      });

      ctx.fillStyle = light ? 'rgba(42, 26, 64, 0.8)' : 'rgb(58, 38, 88)';
      bats.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y + b.base);
        ctx.scale(b.dir, 1);
        const flap = b.flap ?? Math.sin(clock * b.flapSpeed + b.phase);
        drawBat(ctx, 0, 0, b.size, flap);
        ctx.restore();
      });
    }

    // One frame for reduced motion: bats caught mid-flight, wings at assorted angles.
    function still() {
      bats = []; embers = [];
      fill(true);
      bats.forEach((b, i) => { b.flap = [0.7, -0.4, 0.3, -0.8, 0.5, 0][i % 6]; b.base = 0; });
    }

    fill(true);

    function resize(oldW, oldH) {
      if (!oldW || !oldH) return;
      [...bats, ...embers].forEach(o => { o.x = (o.x / oldW) * view.w; o.y = (o.y / oldH) * view.h; });
    }

    return { step, draw, still, resize };
  }

  const EFFECTS = { fireworks: createFireworks, snowfall: createSnow, christmas: createChristmas, halloween: createHalloween, friday13: createFriday13 };

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
    const pview = { w: 0, h: 0, dpr: 1, scale: 0.3, line: 0.6, flakes: 14, mist: 3, glyphs: 4, bats: 2, embers: 7, sparkles: 6, lightsTop: 0 };
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
      random = seeded({ fireworks: 11, snowfall: 5, christmas: 25, halloween: 31, friday13: 13 }[season] || 5);
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
