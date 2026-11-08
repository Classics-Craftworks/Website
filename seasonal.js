/* Seasonal themes: the moving (or, with reduced motion, still) picture behind the page.

   settings.js decides which theme is in effect and puts it on <html> as data-season
   ("fireworks", "aurora", "blossom", "fireflies", "friday13", "halloween", "leaves", "snowfall" or "christmas", absent = none). This file only draws it:
   a fixed, click-through <canvas> behind everything (styles.css: .season-canvas).

   - Fireworks: rockets rise and burst into sparks.
   - Aurora: slow green, teal and violet northern-lights curtains sway across the upper sky.
   - Fireflies: fireflies wander and blink under a blue-to-rose twilight sky.
   - Cherry Blossom: pink petals drift and flutter down on a light breeze.
   - Falling Leaves: brown autumn leaves tumble and drift down.
   - Snowfall: snow drifts down.
   - Christmas: a string of fairy lights twinkles along the top, golden sparkles drift down and a treeline of
     pines with small lights stands along the bottom.
   - Halloween: bats flap across a hazy moon while embers rise from a warm glow at the bottom.
   - Friday 13th: mist drifts across, faint "13"s float up and fade, and every few seconds, mostly near the
     side margins, a branching lightning bolt strikes down from the top and fades with a soft glow (one smooth
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
  // A position across the width, as a fraction: usually in the side margins (the outer fifth on each side,
  // where the page has the least on it), otherwise anywhere in the middle. share = how often a margin.
  const marginX = (share, middleMin = 0.12, middleMax = 0.88) =>
    random() < share ? (random() < 0.5 ? rand(0.02, 0.12) : rand(0.88, 0.98)) : rand(middleMin, middleMax);

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
      const x = view.w * marginX(0.7);
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
      if (untilLaunch <= 0 && rockets.length < 4) {
        launch();
        untilLaunch = rand(0.45, 1.1);
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
      const spots = [[0.1, 0.28], [0.9, 0.22], [0.5, 0.16], [0.05, 0.56], [0.95, 0.5]];
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
    let untilFlash = 2;   // the first one comes soon, so a new choice is seen to do something
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
      if (untilFlash <= 0) { flashAge = 0; flashX = marginX(0.8, 0.3, 0.7); bolt = makeBolt(view.w * flashX); untilFlash = rand(5, 10); }
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

    /* The treeline: two rows of pines along the bottom edge, taller towards the side margins and low in the
       middle, so the middle of the page stays clear. Laid out once per window size from a fixed seed (so the
       trees stand in the same places every time, whatever Math.random is doing), with a few small lights on
       each front tree and a star on some of the tallest. */
    let trees = null;
    let treesFor = '';

    function layoutTrees() {
      const key = view.w + 'x' + view.h;
      if (trees && treesFor === key) return;
      treesFor = key;
      const rng = seeded(25);
      const between = (a, b) => a + rng() * (b - a);
      const u = unit();
      const rows = [{ back: true, scale: 0.68, shift: 0.5 }, { back: false, scale: 1, shift: 0 }];
      trees = rows.map(row => {
        const list = [];
        let x = -20 * u + row.shift * 30 * u;
        while (x < view.w + 20) {
          const edge = Math.abs(x / view.w - 0.5) * 2; // 0 in the middle, 1 at the sides
          const height = view.h * (0.06 + 0.23 * Math.pow(edge, 1.7)) * between(0.8, 1.2) * row.scale;
          const width = Math.max(6, height * between(0.5, 0.62));
          const tree = { x, height, width, tiers: height > 70 * u ? 4 : 3, bulbs: [], star: false };
          if (!row.back && height > 30) { // trees too small to carry lights (the preview tiles) go without
            const count = Math.max(2, Math.round(height / (20 * u + 8)));
            for (let i = 0; i < count; i++) {
              const t = between(0.25, 0.95); // down the tree
              tree.bulbs.push({ dx: between(-0.8, 0.8) * t * width / 2, dy: -height * (1 - t), i: list.length * 7 + i });
            }
            tree.star = height > 110 * u && rng() < 0.45;
          }
          list.push(tree);
          x += width * between(0.5, 0.75);
        }
        return { back: row.back, list };
      });
    }

    // One tree as a single outline (apex, down the right side in tiers, trunk, back up the left), so that it
    // fills as one shape.
    function treePath(ctx, t, baseY) {
      const apexY = baseY - t.height;
      const trunk = Math.max(1, t.width * 0.08);
      const hw = i => (t.width / 2) * (0.38 + 0.62 * (i + 1) / t.tiers);
      const yb = i => apexY + t.height * 0.92 * (0.3 + 0.7 * (i + 1) / t.tiers);
      ctx.beginPath();
      ctx.moveTo(t.x, apexY);
      for (let i = 0; i < t.tiers; i++) {
        ctx.lineTo(t.x + hw(i), yb(i));
        if (i < t.tiers - 1) ctx.lineTo(t.x + hw(i) * 0.5, yb(i));
      }
      ctx.lineTo(t.x + trunk, yb(t.tiers - 1));
      ctx.lineTo(t.x + trunk, baseY);
      ctx.lineTo(t.x - trunk, baseY);
      ctx.lineTo(t.x - trunk, yb(t.tiers - 1));
      for (let i = t.tiers - 1; i >= 0; i--) {
        ctx.lineTo(t.x - hw(i), yb(i));
        if (i > 0) ctx.lineTo(t.x - hw(i - 1) * 0.5, yb(i - 1));
      }
      ctx.closePath();
    }

    function drawTrees(ctx, light) {
      layoutTrees();
      const colours = LIGHT_COLOURS[light ? 'light' : 'dark'];
      const baseY = view.h + 2;
      trees.forEach(row => {
        ctx.fillStyle = row.back
          ? (light ? 'rgba(52, 84, 92, 0.45)' : 'rgb(18, 30, 42)')
          : (light ? 'rgba(34, 62, 70, 0.78)' : 'rgb(22, 44, 54)');
        row.list.forEach(t => { treePath(ctx, t, baseY); ctx.fill(); });
      });

      // the lights and stars on the front row
      const front = trees[1].list;
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      front.forEach(t => {
        t.bulbs.forEach(b => {
          const level = 0.6 + 0.4 * Math.sin(clock * (0.6 + (b.i % 5) * 0.2) + b.i * 2.1);
          const bx = t.x + b.dx;
          const by = baseY + b.dy;
          const rad = Math.max(1, 2.2 * unit());
          ctx.fillStyle = colours[b.i % colours.length];
          ctx.globalAlpha = (light ? 0.22 : 0.3) * level;
          ctx.beginPath(); ctx.arc(bx, by, rad * 3, 0, TAU); ctx.fill();
          ctx.globalAlpha = 0.55 + 0.45 * level;
          ctx.beginPath(); ctx.arc(bx, by, rad, 0, TAU); ctx.fill();
        });
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgb(${SPARKLE_COLOURS[light ? 'light' : 'dark']})`;
      front.forEach(t => { if (t.star) star(ctx, t.x, baseY - t.height - 2, Math.max(2.5, t.width * 0.11)); });
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
      drawTrees(ctx, light);
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
      trees = null;
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
        b.flap = null; // a still frame fixes the wings; once anything moves they go back to flapping
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

  /* ---------- Falling Leaves ---------- */

  // Browns for the leaves; the light theme needs deeper ones to stand out against a pale page.
  const LEAF_COLOURS = {
    dark:  ['#a8672f', '#8f4f22', '#c9863f', '#74401a', '#b9722c', '#96592a'],
    light: ['#8a4a1a', '#6e3811', '#a35a1b', '#5b2d0d', '#94521a', '#7a4118']
  };

  function createLeaves(view) {
    let leaves = [];
    let clock = 0;

    const unit = () => view.scale !== undefined ? view.scale * 1.6 : Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const wanted = () => view.leaves ?? Math.round(Math.min(48, Math.max(14, (view.w * view.h) / 24000)));

    function leaf(anywhere) {
      const size = rand(7, 13) * unit();
      return {
        x: rand(0, view.w), y: anywhere ? rand(0, view.h) : rand(-30, -4),
        size, colour: pick(LEAF_COLOURS.dark.map((_, i) => i)),
        fall: rand(28, 52) * unit() + 10, // a leaf drifts down more slowly than rain, a little faster when larger
        sway: rand(14, 40) * unit(), swaySpeed: rand(0.35, 0.9), phase: rand(0, TAU),
        angle: rand(0, TAU), spin: rand(-1.2, 1.2),
        tumble: rand(0.8, 2.2), alpha: rand(0.65, 0.95)
      };
    }

    function fill(anywhere) {
      const count = wanted();
      while (leaves.length < count) leaves.push(leaf(anywhere));
      if (leaves.length > count) leaves.length = count;
    }

    function step(dt) {
      clock += dt;
      fill(false);
      leaves.forEach(l => {
        l.y += l.fall * dt;
        l.x += Math.sin(clock * l.swaySpeed + l.phase) * l.sway * dt;
        l.angle += l.spin * dt;
        if (l.y > view.h + l.size * 2) { Object.assign(l, leaf(false)); }
        if (l.x < -20) l.x = view.w + 20; else if (l.x > view.w + 20) l.x = -20;
      });
    }

    function draw(ctx) {
      const palette = LEAF_COLOURS[isLight() ? 'light' : 'dark'];
      ctx.lineCap = 'round';
      leaves.forEach(l => {
        const s = l.size;
        // Turning over as it falls: the leaf narrows to an edge and widens again.
        const flip = Math.cos(clock * l.tumble + l.phase);
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);
        ctx.scale(0.25 + 0.75 * Math.abs(flip), 1);
        ctx.globalAlpha = l.alpha;
        ctx.fillStyle = palette[l.colour % palette.length];
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.95, -s * 0.5, s * 0.8, s * 0.55, 0, s);
        ctx.bezierCurveTo(-s * 0.8, s * 0.55, -s * 0.95, -s * 0.5, 0, -s);
        ctx.fill();
        ctx.strokeStyle = 'rgba(40, 18, 5, 0.45)';
        ctx.lineWidth = Math.max(0.5, s * 0.08);
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(0, s * 1.25);
        ctx.stroke();
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    }

    function still() { leaves = []; fill(true); }

    fill(true);

    function resize(oldW, oldH) {
      if (!oldW || !oldH) return;
      leaves.forEach(l => { l.x = (l.x / oldW) * view.w; l.y = (l.y / oldH) * view.h; });
    }

    return { step, draw, still, resize };
  }

  /* ---------- Cherry Blossom ---------- */

  // Petal pinks; the light theme needs deeper ones to show against a pale page.
  const PETAL_COLOURS = {
    dark:  ['#ffc2d6', '#ffb0c8', '#ffd6e4', '#f79ab8', '#ffe3ec'],
    light: ['#e8749c', '#d95a86', '#ee8fb0', '#cc4a78', '#f2a3bf']
  };

  function createBlossom(view) {
    let petals = [];
    let clock = 0;

    const unit = () => view.scale !== undefined ? view.scale * 1.6 : Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const wanted = () => view.petals ?? Math.round(Math.min(70, Math.max(22, (view.w * view.h) / 14000)));

    function petal(anywhere) {
      return {
        x: rand(-20, view.w + 20), y: anywhere ? rand(0, view.h) : rand(-30, -4),
        size: rand(6, 11) * unit(), colour: Math.floor(random() * PETAL_COLOURS.dark.length),
        fall: rand(18, 36) * unit() + 8, // slower than leaves: petals float
        drift: rand(6, 16) * unit(),       // a steady push to one side, like a light breeze
        sway: rand(14, 34) * unit(), swaySpeed: rand(0.3, 0.8), phase: rand(0, TAU),
        angle: rand(0, TAU), spin: rand(-1.6, 1.6),
        tumble: rand(1, 2.6), alpha: rand(0.7, 0.95)
      };
    }

    function fill(anywhere) {
      const count = wanted();
      while (petals.length < count) petals.push(petal(anywhere));
      if (petals.length > count) petals.length = count;
    }

    function step(dt) {
      clock += dt;
      fill(false);
      petals.forEach(p => {
        p.y += p.fall * dt;
        p.x += (p.drift + Math.sin(clock * p.swaySpeed + p.phase) * p.sway) * dt;
        p.angle += p.spin * dt;
        if (p.y > view.h + p.size * 2) Object.assign(p, petal(false));
        if (p.x > view.w + 24) p.x = -24; else if (p.x < -24) p.x = view.w + 24;
      });
    }

    function draw(ctx) {
      const palette = PETAL_COLOURS[isLight() ? 'light' : 'dark'];
      petals.forEach(p => {
        const s = p.size;
        const flip = Math.cos(clock * p.tumble + p.phase);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.scale(0.3 + 0.7 * Math.abs(flip), 1);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = palette[p.colour % palette.length];
        // A rounded petal with a small notch at the tip, narrowing to the base.
        ctx.beginPath();
        ctx.moveTo(0, s * 1.1);
        ctx.bezierCurveTo(s * 1.15, s * 0.5, s * 1.0, -s * 0.9, s * 0.28, -s);
        ctx.lineTo(0, -s * 0.7);
        ctx.lineTo(-s * 0.28, -s);
        ctx.bezierCurveTo(-s * 1.0, -s * 0.9, -s * 1.15, s * 0.5, 0, s * 1.1);
        ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    }

    function still() { petals = []; fill(true); }

    fill(true);

    function resize(oldW, oldH) {
      if (!oldW || !oldH) return;
      petals.forEach(p => { p.x = (p.x / oldW) * view.w; p.y = (p.y / oldH) * view.h; });
    }

    return { step, draw, still, resize };
  }

  /* ---------- Fireflies ---------- */

  // Glow colours as "r, g, b": a yellow-green on dark pages, a deeper amber on the light theme.
  const FIREFLY_COLOURS = { dark: '215, 255, 110', light: '190, 120, 10' };
  // The twilight sky, top to bottom: dusky blue, violet, then a rose-pink horizon. Nothing orange, so it stays
  // apart from Halloween's warm glow, and kept soft and fairly light so it reads as dusk rather than night.
  const TWILIGHT = {
    dark: [
      [0, '85, 95, 205', 0.16], [0.5, '150, 105, 205', 0.14], [0.8, '210, 120, 185', 0.2], [1, '235, 140, 175', 0.26]
    ],
    light: [
      [0, '110, 120, 215', 0.12], [0.5, '165, 125, 215', 0.1], [0.8, '225, 140, 190', 0.15], [1, '240, 155, 185', 0.2]
    ]
  };

  function createFireflies(view) {
    let flies = [];
    let clock = 0;
    let held = false; // reduced motion: every firefly shown part-lit

    const unit = () => view.scale !== undefined ? view.scale * 1.6 : Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const wanted = () => view.flies ?? Math.round(Math.min(55, Math.max(20, (view.w * view.h) / 18000)));

    function fly() {
      return {
        x: rand(0, view.w), y: rand(view.h * 0.3, view.h * 0.98),
        heading: rand(0, TAU), turn: rand(0.4, 1.1), turnPhase: rand(0, TAU),
        speed: rand(10, 26) * unit(),
        size: rand(2.2, 3.8) * unit(),
        period: rand(2.6, 5.2), phase: rand(0, TAU) // seconds per blink
      };
    }

    function fill() {
      const count = wanted();
      while (flies.length < count) flies.push(fly());
      if (flies.length > count) flies.length = count;
    }

    // 0 (dark) to 1 (fully lit): a slow swell, then a long pause, like the real thing.
    function glow(f) {
      const wave = Math.sin(clock * TAU / f.period + f.phase);
      if (held) return 0.55 + 0.45 * wave;
      return Math.pow(Math.max(0, wave), 2);
    }

    function step(dt) {
      clock += dt;
      fill();
      flies.forEach(f => {
        // A lazy, wandering path: the heading sways instead of jumping.
        f.heading += Math.sin(clock * f.turn + f.turnPhase) * 1.3 * dt;
        f.x += Math.cos(f.heading) * f.speed * dt;
        f.y += Math.sin(f.heading) * f.speed * dt * 0.6 - 2 * dt;
        if (f.x < -10) f.x = view.w + 10; else if (f.x > view.w + 10) f.x = -10;
        if (f.y < view.h * 0.2) f.heading = Math.abs(f.heading % TAU) < Math.PI ? f.heading : -f.heading; // stay low
        if (f.y < view.h * 0.2) f.y = view.h * 0.2;
        if (f.y > view.h + 6) f.y = view.h + 6;
      });
    }

    function draw(ctx) {
      const light = isLight();
      // Twilight: the whole sky, dusky blue at the top shading through violet to a rose-pink horizon.
      const sky = ctx.createLinearGradient(0, 0, 0, view.h);
      TWILIGHT[light ? 'light' : 'dark'].forEach(([at, rgb, alpha]) => sky.addColorStop(at, `rgba(${rgb}, ${alpha})`));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, view.w, view.h);

      const rgb = FIREFLY_COLOURS[light ? 'light' : 'dark'];
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      flies.forEach(f => {
        const g = glow(f);
        if (g < 0.02) return;
        const radius = f.size * 8;
        const halo = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius);
        halo.addColorStop(0, `rgba(${rgb}, ${0.55 * g * (light ? 0.8 : 1)})`);
        halo.addColorStop(0.35, `rgba(${rgb}, ${0.16 * g})`);
        halo.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(f.x, f.y, radius, 0, TAU);
        ctx.fill();
        ctx.fillStyle = light ? `rgba(${rgb}, ${0.95 * g})` : `rgba(255, 255, 200, ${0.95 * g})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, TAU);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    function still() { flies = []; held = true; clock = 1; fill(); }

    fill();

    function resize(oldW, oldH) {
      if (!oldW || !oldH) return;
      flies.forEach(f => { f.x = (f.x / oldW) * view.w; f.y = (f.y / oldH) * view.h; });
    }

    return { step, draw, still, resize };
  }

  /* ---------- Aurora ---------- */

  // Curtain colours as "r, g, b". On dark pages they are added to the sky (so they glow); on the light
  // theme they are laid on top, darker and fainter.
  const AURORA_BANDS = {
    dark: [
      { rgb: '70, 255, 170', y: 0.30, len: 0.30, alpha: 0.42, drift: 0.11 },
      { rgb: '60, 200, 235', y: 0.40, len: 0.26, alpha: 0.30, drift: -0.08 },
      { rgb: '175, 115, 255', y: 0.22, len: 0.24, alpha: 0.26, drift: 0.07 }
    ],
    light: [
      { rgb: '20, 150, 95', y: 0.30, len: 0.30, alpha: 0.26, drift: 0.11 },
      { rgb: '20, 125, 175', y: 0.40, len: 0.26, alpha: 0.20, drift: -0.08 },
      { rgb: '110, 60, 190', y: 0.22, len: 0.24, alpha: 0.17, drift: 0.07 }
    ]
  };

  function createAurora(view) {
    let clock = 0;
    const sprites = new Map(); // one thin gradient strip per colour, stretched to each ray

    // A ray: clear at the top, building up and ending in a bright, fairly sharp lower edge.
    function sprite(rgb) {
      let strip = sprites.get(rgb);
      if (!strip) {
        strip = document.createElement('canvas');
        strip.width = 4; // wide enough that stretching a middle slice never blends in the transparent edge
        strip.height = 128;
        const g = strip.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 0, 128);
        grad.addColorStop(0, `rgba(${rgb}, 0)`);
        grad.addColorStop(0.55, `rgba(${rgb}, 0.22)`);
        grad.addColorStop(0.88, `rgba(${rgb}, 0.85)`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);
        g.fillStyle = grad;
        g.fillRect(0, 0, 4, 128);
        sprites.set(rgb, strip);
      }
      return strip;
    }

    function step(dt) { clock += dt; }

    function draw(ctx) {
      const light = isLight();
      const bands = AURORA_BANDS[light ? 'light' : 'dark'];
      const stepX = Math.max(2, Math.min(6, Math.round(view.w / 200)));
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';

      bands.forEach((b, bi) => {
        const strip = sprite(b.rgb);
        const t = clock * 0.35 + bi * 11;
        const dpr = view.dpr || 1;
        const snap = v => Math.round(v * dpr) / dpr; // device-pixel edges, so neighbouring rays meet exactly
        for (let x = -stepX; x < view.w + stepX; x += stepX) {
          const u = x / view.w;
          // The curtain's lower edge undulates slowly; its height and brightness shimmer along its length.
          const edge = view.h * (b.y + 0.07 * Math.sin(u * 5.2 + t * b.drift * 4 + bi) + 0.035 * Math.sin(u * 11 - t * 0.5 + bi * 2));
          const len = view.h * b.len * (0.65 + 0.35 * Math.sin(u * 7.5 + t * 0.6 + bi * 3));
          const glow = 0.55 + 0.45 * Math.sin(u * 17 + t * 1.1 + bi * 5) * Math.sin(u * 3.1 + t * 0.3);
          ctx.globalAlpha = Math.max(0, b.alpha * glow);
          const left = snap(x);
          // No overlap and no gap between rays: an overlap doubles up when added to the sky and shows as a line.
          ctx.drawImage(strip, 1, 0, 2, 128, left, edge - len, snap(x + stepX) - left, len);
        }
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // One frame for reduced motion: the curtains caught mid-sway.
    function still() { clock = 9; }

    return { step, draw, still, resize() {} };
  }

  const EFFECTS = { fireworks: createFireworks, aurora: createAurora, blossom: createBlossom, fireflies: createFireflies, friday13: createFriday13, halloween: createHalloween, leaves: createLeaves, snowfall: createSnow, christmas: createChristmas };

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
    const pview = { w: 0, h: 0, dpr: 1, scale: 0.3, line: 0.6, flakes: 14, mist: 3, glyphs: 4, bats: 2, flies: 8, embers: 7, sparkles: 6, lightsTop: 0 };
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
      random = seeded({ fireworks: 11, aurora: 7, blossom: 3, fireflies: 18, snowfall: 5, christmas: 25, halloween: 31, leaves: 23, friday13: 13 }[season] || 5);
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
