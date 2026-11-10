/* Seasonal themes: the moving (or, with reduced motion, still) picture behind the page.

   settings.js decides which theme is in effect and puts it on <html> as data-season
   ("fireworks", "aurora", "anniversary", "blossom", "easter", "fireflies", "friday13", "halloween", "leaves", "snowfall" or "christmas", absent = none). This file only draws it:
   a fixed, click-through <canvas> behind everything (styles.css: .season-canvas).

   - Fireworks: Minecraft-style rockets rise and burst into small square-pixel sparkles, now and then a Creeper face.
   - Aurora: slow green, teal and violet northern-lights curtains sway across the upper sky.
   - Anniversary: bright square confetti falls while pixel party balloons float up the page.
  - Easter: pastel Minecraft-style eggs rock gently as they drift down among a few little square pixel daisies.
  - Fireflies: square fireflies, each with a soft glow, wander and blink under a blue-to-rose twilight sky.
   - Cherry Blossom: Minecraft-style pink square cherry leaves spin down on a light breeze.
   - Falling Leaves: brown Minecraft-style leaves spin and drift down.
   - Snowfall: tiny Minecraft-style white snow particles (3x3 pixel shapes with some pixels missing) drift down.
   - Christmas: a string of square fairy lights twinkles along the top, golden plus-shaped sparkles drift down and a
     treeline of opaque Minecraft spruce trees with small lights stands along the bottom.
   - Halloween: pixelated bats flap across a hazy square moon (with a round glow) while square embers rise from a warm glow at the bottom.
   - Friday 13th: mist drifts across, faint "13"s float up and fade, and every few seconds, mostly near the
     side margins, a branching lightning bolt strikes down from the top and fades with a soft glow (one smooth
     strike, never a flicker).
   - April Fools ("aprilfools") has no canvas: it is a mud-brown re-skin of the whole site ("Classic's Mudworks") done in styles.css, so
     it is not in EFFECTS below and nothing is drawn.
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

  /* Minecraft-style fireworks. Everything is built from small square pixels (no circles, no
     streaks): sparks are tiny four-point sparkles, the rocket leaves a little flame trail, and it bursts into one of the firework-star
     shapes (small ball, large ball, star, burst). Now and then (CREEPER_CHANCE) it bursts into a Creeper
     face instead: an 8x8 head of green squares with the face left as gaps. */

  const FIREWORK_COLOURS = {
    dark:  ['#ff5555', '#ffaa00', '#ffff55', '#55ff55', '#55ffff', '#7a85ff', '#ff55ff', '#b45dff', '#ffffff'],
    light: ['#c4202a', '#c06a00', '#a88600', '#1f9a2a', '#0a8f9c', '#3341cc', '#b4239e', '#7a2fc4', '#1b2540']
  };
  const CREEPER_GREENS = {
    dark:  ['#8dff7a', '#6dff5c', '#55ff55', '#4fe04a'],
    light: ['#2e8a2a', '#27761f', '#1f6b1b', '#1a5e17']
  };
  // The Creeper's face; # is a firework particle (the eyes and mouth), . is empty.
  const CREEPER_FACE = [
    '........',
    '........',
    '.##..##.',
    '.##..##.',
    '...##...',
    '..####..',
    '..####..',
    '..#..#..'
  ];
  const CREEPER_CHANCE = 0.09; // roughly one burst in eleven
  const SHAPES = [['small', 35], ['large', 25], ['star', 22], ['burst', 18]];

  const hexRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const mixRgb = (a, b, t) => 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')';

  function createFireworks(view) {
    const rockets = [];
    const sparks = [];
    const heads = []; // Creeper faces
    let untilLaunch = 0.2; // the first rocket goes almost at once so a new choice is seen straight away

    const scale = () => view.scale ?? Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const unit = () => Math.max(1, Math.round(2.2 * scale()));       // one square pixel of a spark
    const headCell = () => Math.max(4, Math.round(14 * scale()));    // spacing of the Creeper's face particles
    // A spark is a little four-point sparkle made of square pixels (a plus), like Minecraft's firework
    // particles; near the end of its life it shrinks to a single pixel.
    function sparkle(ctx, x, y, u, small) {
      x = Math.round(x); y = Math.round(y);
      if (small) { ctx.fillRect(x - u / 2, y - u / 2, u, u); return; }
      ctx.fillRect(x - u * 1.5, y - u / 2, u * 3, u);
      ctx.fillRect(x - u / 2, y - u * 1.5, u, u * 3);
    }

    function launch() {
      const x = view.w * marginX(0.7);
      const targetY = rand(view.h * 0.14, view.h * 0.5);
      const riseTime = rand(0.9, 1.3); // seconds from the bottom edge to the burst
      rockets.push({
        x, y: view.h + 4, px: x, py: view.h + 4,
        vx: rand(-30, 30) * scale(), vy: -(view.h + 4 - targetY) / riseTime, targetY
      });
    }

    function spark(x, y, vx, vy, life, from, to, extra) {
      sparks.push(Object.assign({
        x, y, vx, vy, age: 0, life, from, to, grow: 1, gravity: 1, twinkle: false, phase: rand(0, TAU)
      }, extra));
    }

    function pickShape() {
      let roll = random() * SHAPES.reduce((sum, s) => sum + s[1], 0);
      for (const [name, weight] of SHAPES) { if ((roll -= weight) < 0) return name; }
      return 'small';
    }

    // Where the sparks of each shape start out, as velocities (they all fly outwards and slow down, so the
    // shape holds): a ball is a sphere seen from the side (so crowded at its edge), a star is a five-pointed outline.
    function shapeVelocities(shape, power) {
      const out = [];
      if (shape === 'small' || shape === 'large') {
        const count = shape === 'small' ? Math.round(rand(44, 60)) : Math.round(rand(84, 112));
        const turn = rand(0, TAU);
        for (let i = 0; i < count; i++) {
          const y = 1 - (i + 0.5) / count * 2;                  // evenly down a sphere...
          const r = Math.sqrt(1 - y * y);
          const a = i * 2.399963 + turn;                        // ...by the golden angle
          out.push([Math.cos(a) * r * power, y * power]);
        }
      } else if (shape === 'star') {
        const points = 5, perEdge = 7, turn = rand(0, TAU);
        const vertex = k => {
          const a = turn - Math.PI / 2 + (k / (points * 2)) * TAU;
          const r = k % 2 ? 0.42 : 1;
          return [Math.cos(a) * r, Math.sin(a) * r];
        };
        for (let k = 0; k < points * 2; k++) {
          const [ax, ay] = vertex(k), [bx, by] = vertex(k + 1);
          for (let j = 0; j < perEdge; j++) {
            const t = j / perEdge;
            out.push([(ax + (bx - ax) * t) * power, (ay + (by - ay) * t) * power]);
          }
        }
      } else { // burst: a scatter
        const count = Math.round(rand(48, 66));
        for (let i = 0; i < count; i++) {
          const a = rand(0, TAU), s = power * Math.sqrt(random());
          out.push([Math.cos(a) * s, Math.sin(a) * s]);
        }
      }
      return out;
    }

    function burst(x, y, kind) {
      const mode = isLight() ? 'light' : 'dark';
      if (kind === 'creeper' || (!kind && random() < CREEPER_CHANCE)) { creeper(x, y); return; }

      const colours = FIREWORK_COLOURS[mode];
      const main = hexRgb(pick(colours));
      const second = random() < 0.4 ? hexRgb(pick(colours)) : main;
      const fade = random() < 0.6 ? hexRgb(pick(colours)) : null; // sparks can shift to another colour as they go
      const shape = kind || pickShape();
      const power = (shape === 'large' ? rand(150, 200) : rand(100, 140)) * scale();
      const twinkle = random() < 0.3;
      shapeVelocities(shape, power).forEach(([vx, vy], i) => {
        const from = i % 2 ? main : second;
        spark(x, y, vx, vy, rand(1.3, 2.0), from, fade || from, { twinkle });
      });
    }

    function creeper(x, y, quiet) {
      const mode = isLight() ? 'light' : 'dark';
      const greens = CREEPER_GREENS[mode].map(hexRgb);
      const cells = [];
      CREEPER_FACE.forEach((row, r) => {
        for (let c = 0; c < 8; c++) {
          if (row[c] !== '#') continue; // only the eyes and mouth are firework; the rest of the head is empty sky
          // Particles drop out one by one near the end, so the face crumbles instead of fading as one.
          cells.push({ ox: c - 3.5, oy: r - 4.5, colour: pick(greens), gone: rand(0.62, 1), phase: rand(0, TAU) });
        }
      });
      heads.push({ x, y, vy: -18 * scale(), age: 0, life: 2.4, cells, sway: rand(0, TAU) });
      // A small puff of green sparks as it appears.
      if (quiet) return;
      const puff = hexRgb(CREEPER_GREENS[mode][0]);
      for (let i = 0; i < 18; i++) {
        const a = rand(0, TAU), s = rand(30, 80) * scale();
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.5, 0.9), puff, puff, { tiny: true });
      }
    }

    function step(dt) {
      untilLaunch -= dt;
      if (untilLaunch <= 0 && rockets.length < 4) {
        launch();
        untilLaunch = rand(0.45, 1.1);
      }

      const light = isLight();
      const flame = light ? [184, 116, 0] : [255, 233, 176];
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.px = r.x; r.py = r.y;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        // Flame sparks falling off the back of the rocket.
        if (sparks.length < 900) {
          spark(r.x + rand(-1, 1), r.y + unit() * 2, rand(-8, 8) * scale(), rand(10, 34) * scale(), rand(0.35, 0.6), flame, [120, 120, 120], { gravity: 0.15, tiny: true });
        }
        if (r.y <= r.targetY) {
          burst(r.x, r.y);
          rockets.splice(i, 1);
        }
      }

      const drag = Math.pow(0.97, dt * 60);
      const gravity = (view.scale ? 55 * view.scale : 55);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.age += dt;
        if (p.age >= p.life) { sparks.splice(i, 1); continue; }
        p.vx *= drag;
        p.vy = p.vy * drag + gravity * p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      for (let i = heads.length - 1; i >= 0; i--) {
        const h = heads[i];
        h.age += dt;
        if (h.age >= h.life) { heads.splice(i, 1); continue; }
        h.vy += 26 * scale() * dt; // floats up a touch, then sinks
        h.y += h.vy * dt;
      }
    }

    function draw(ctx) {
      const light = isLight();
      const u = unit();

      // The Creeper's face: sparkles laid out on its eyes and mouth.
      heads.forEach(h => {
        const cell = headCell();
        const u = unit();
        const form = Math.min(1, h.age / 0.35);
        const spread = 1 - Math.pow(1 - form, 3);   // flies out from the centre into the face
        const centreX = Math.round(h.x + Math.sin(h.age * 2.2 + h.sway) * 3 * scale());
        const centreY = Math.round(h.y);
        const t = h.age / h.life;
        h.cells.forEach(c => {
          if (t > c.gone) return;
          let alpha = Math.min(1, form * 2) * Math.min(1, (1 - t) * 2.5);
          if (Math.sin(h.age * 30 + c.phase) < -0.6) alpha *= 0.45; // a little twinkle
          ctx.globalAlpha = alpha;
          ctx.fillStyle = 'rgb(' + c.colour.join(',') + ')';
          sparkle(ctx, centreX + c.ox * cell * spread, centreY + c.oy * cell * spread, u, t > 0.75);
        });
      });

      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';

      // Rockets: a sparkle head.
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = light ? '#b87400' : '#ffe9b0';
      rockets.forEach(r => sparkle(ctx, r.x, r.y, u, false));

      // Sparks: little sparkles, shrinking and fading (and shifting colour) towards the end.
      sparks.forEach(p => {
        const t = p.age / p.life;
        let alpha = Math.min(1, (1 - t) * 1.8) * (light ? 0.9 : 1);
        if (p.twinkle && Math.sin(p.age * 38 + p.phase) < -0.15) alpha *= 0.25; // blinking sparks
        ctx.globalAlpha = alpha;
        ctx.fillStyle = mixRgb(p.from, p.to, Math.min(1, t * 1.4));
        sparkle(ctx, p.x, p.y, u, t > 0.7 || p.tiny);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // One frame for reduced motion: a few bursts caught partway through, with a Creeper among them.
    function still() {
      const spots = [[0.1, 0.28, 'large'], [0.9, 0.22, 'star'], [0.5, 0.16, 'small'], [0.05, 0.56, 'burst']];
      spots.forEach(([fx, fy, kind]) => burst(view.w * fx, view.h * fy, kind));
      sparks.forEach(p => {
        p.age = p.life * 0.25;
        p.x += p.vx * 0.3; p.y += p.vy * 0.3;
        p.vx = p.vx * 0.6; p.vy = p.vy * 0.6;
      });
      creeper(view.w * 0.93, view.h * 0.52, true);
      heads.forEach(h => { h.age = 0.9; });
    }

    return { step, draw, still, resize() {} };
  }

  /* ---------- Snowfall ---------- */

  /* Minecraft-style snow: tiny white particles on a 3x3 pixel grid, in the four shapes the game uses: a plus,
     an X, a plus with its middle missing, and a single pixel. They never overlap and only tip slightly to and fro with the wind: each is one flat
     shape, drawn with smoothing off so its pixels stay sharp. # is a lit pixel. */
  const SNOW_SHAPES = [
    ['.#.', '###', '.#.'],   // plus
    ['#.#', '.#.', '#.#'],   // X
    ['.#.', '#.#', '.#.'],   // plus, middle missing
    ['...', '.#.', '...']    // a single pixel
  ];
  const snowTextures = {};
  function snowTexture(mode, shape) {
    const key = mode + shape;
    if (snowTextures[key]) return snowTextures[key];
    const c = document.createElement('canvas');
    c.width = c.height = 3;
    const g = c.getContext('2d');
    g.fillStyle = `rgb(${SNOW_COLOURS[mode]})`;
    SNOW_SHAPES[shape].forEach((row, y) => {
      for (let x = 0; x < 3; x++) if (row[x] === '#') g.fillRect(x, y, 1, 1);
    });
    return (snowTextures[key] = c);
  }

  function createSnow(view) {
    let flakes = [];

    const wanted = () => view.flakes ?? Math.round(Math.min(150, Math.max(36, (view.w * view.h) / 11000)));

    function flake(anywhere) {
      const pixel = Math.max(1, Math.round(rand(1.7, 4.6) * (view.line ?? 1))); // screen pixels per grid pixel
      return {
        x: rand(0, view.w),
        y: anywhere ? rand(0, view.h) : rand(-20, -2),
        pixel, shape: Math.floor(random() * SNOW_SHAPES.length),
        fall: rand(22, 38) + pixel * 9, // bigger flakes are nearer, so they fall faster
        sway: rand(6, 22), swaySpeed: rand(0.4, 1.1), phase: rand(0, TAU),
        alpha: rand(0.65, 1),
        lean: rand(0.15, 0.45) // how far the wind tips it over, in radians
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
      const mode = isLight() ? 'light' : 'dark';
      ctx.imageSmoothingEnabled = false;
      flakes.forEach(f => {
        const size = f.pixel * 3;
        ctx.globalAlpha = f.alpha;
        // Pushed by the wind: it tips one way as it is carried that way, and back as the gust turns.
        ctx.save();
        ctx.translate(Math.round(f.x), Math.round(f.y));
        ctx.rotate(Math.cos(clock * f.swaySpeed + f.phase) * f.lean);
        ctx.drawImage(snowTexture(mode, f.shape), -size / 2, -size / 2, size, size);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
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
      if (untilFlash <= 0) { flashAge = 0; flashX = marginX(0.8, 0.3, 0.7); bolt = makeBolt(view.w * flashX); untilFlash = view.flashEvery ? rand(...view.flashEvery) : rand(5, 10); }
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
      // The Settings card carries on from this picture when hovered, so it needs a bolt coming soon;
      // the page itself never moves after a still.
      untilFlash = view.flashEvery ? 0.4 : Infinity;
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

  /* A Minecraft spruce tree seen from the side, one character per block: L is leaves, T is trunk, . is empty.
     A small cap, a plus-shaped layer, a bare gap of trunk, two more layers, a narrower one, the widest layer and then
     a long bare trunk. Each tree is drawn from this as one flat, opaque silhouette. */
  const SPRUCE = [
    '..L..',
    '.LLL.',
    '..T..',
    '.LLL.',
    'LLLLL',
    '.LLL.',
    'LLLLL',
    '..T..',
    '..T..'
  ];
  const SPRUCE_COLS = SPRUCE[0].length;
  const SPRUCE_ROWS = SPRUCE.length;
  // Flat, fully opaque colours, no texture: the old pine treeline's teal for the leaves (the light theme's are the old
  // see-through colours worked out against a pale page) and a muted brown for the trunk. The
  // back row is a shade apart so the rows read separately.
  const SPRUCE_COLOURS = {
    dark: {
      front: { leaf: 'rgb(22, 44, 54)', trunk: 'rgb(38, 26, 19)' },
      back:  { leaf: 'rgb(18, 30, 42)', trunk: 'rgb(25, 19, 17)' }
    },
    light: {
      front: { leaf: 'rgb(80, 103, 110)', trunk: 'rgb(74, 52, 37)' },
      back:  { leaf: 'rgb(158, 173, 179)', trunk: 'rgb(150, 130, 115)' }
    }
  };
  const spruceTextures = {};
  // One spruce as a flat silhouette, a single pixel per block, scaled up with smoothing off so the edges
  // stay square.
  function spruceTexture(mode, back) {
    const key = mode + (back ? 'b' : 'f');
    if (spruceTextures[key]) return spruceTextures[key];
    const c = document.createElement('canvas');
    c.width = SPRUCE_COLS;
    c.height = SPRUCE_ROWS;
    const g = c.getContext('2d');
    const palette = SPRUCE_COLOURS[mode][back ? 'back' : 'front'];
    SPRUCE.forEach((row, r) => {
      for (let col = 0; col < SPRUCE_COLS; col++) {
        if (row[col] === '.') continue;
        g.fillStyle = row[col] === 'T' ? palette.trunk : palette.leaf;
        g.fillRect(col, r, 1, 1);
      }
    });
    return (spruceTextures[key] = c);
  }

  // The block positions of leaves that can carry a light (not the single cap on top).
  const SPRUCE_LEAF_CELLS = [];
  SPRUCE.forEach((row, r) => {
    if (r === 0) return;
    for (let col = 0; col < SPRUCE_COLS; col++) if (row[col] === 'L') SPRUCE_LEAF_CELLS.push([r, col]);
  });

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

    // A plus made of square pixels, like the snowfall theme's: three pixels across and three down, `pixel` screen
    // pixels each, centred on (x, y). Whole pixels only, so the edges stay sharp.
    function plus(ctx, x, y, pixel) {
      const p = Math.max(1, Math.round(pixel));
      const left = Math.round(x - p * 1.5);
      const top = Math.round(y - p * 1.5);
      ctx.fillRect(left + p, top, p, p * 3);
      ctx.fillRect(left, top + p, p * 3, p);
    }

    // A bulb: a soft round glow with a solid square at its centre. haloRadius is how far the glow reaches.
    function bulb(ctx, x, y, side, haloRadius, colour, level, light) {
      const cx = Math.round(x), cy = Math.round(y);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, haloRadius);
      grad.addColorStop(0, colour);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = (light ? 0.3 : 0.42) * level;
      ctx.fillStyle = grad;
      ctx.fillRect(x - haloRadius, y - haloRadius, haloRadius * 2, haloRadius * 2);
      ctx.globalAlpha = 0.55 + 0.45 * level;
      ctx.fillStyle = colour;
      const s = Math.max(1, Math.round(side));
      ctx.fillRect(cx - Math.floor(s / 2), cy - Math.floor(s / 2), s, s);
    }

    /* The treeline: two rows of Minecraft spruces along the bottom edge, taller towards the side margins and low in the
       middle, so the middle of the page stays clear. Laid out once per window size from a fixed seed (so the
       trees stand in the same places every time, whatever Math.random is doing), with a few small square lights on
       each front tree. A tree is a whole number of pixels per block, so its squares stay sharp. */
    let trees = null;
    let treesFor = '';

    function layoutTrees() {
      const key = view.w + 'x' + view.h;
      if (trees && treesFor === key) return;
      treesFor = key;
      const rng = seeded(25);
      const between = (a, b) => a + rng() * (b - a);
      const u = unit();
      const rows = [{ back: true, scale: 0.68, shift: 0.5, gap: [1.3, 2.3] }, { back: false, scale: 1, shift: 0, gap: [1.0, 1.9] }];
      trees = rows.map(row => {
        const list = [];
        let x = -20 * u + row.shift * 30 * u;
        while (x < view.w + 20) {
          const edge = Math.abs(x / view.w - 0.5) * 2; // 0 in the middle, 1 at the sides
          const wanted = view.h * (0.06 + 0.23 * Math.pow(edge, 1.7)) * between(0.8, 1.2) * row.scale;
          const block = Math.max(1, Math.round(wanted / SPRUCE_ROWS));
          const height = block * SPRUCE_ROWS;
          const width = block * SPRUCE_COLS;
          const tree = { x, block, height, width, bulbs: [] };
          if (!row.back && height > 30) { // trees too small to carry lights (the preview tiles) go without
            const count = Math.min(SPRUCE_LEAF_CELLS.length, Math.max(2, Math.round(height / (20 * u + 8))));
            const free = SPRUCE_LEAF_CELLS.slice();
            for (let i = 0; i < count; i++) {
              const [r, col] = free.splice(Math.floor(rng() * free.length), 1)[0];
              tree.bulbs.push({
                dx: (col + 0.5 - SPRUCE_COLS / 2) * block,   // the middle of that block of leaves
                dy: -(SPRUCE_ROWS - r - 0.5) * block,
                i: list.length * 7 + i
              });
            }
          }
          list.push(tree);
          x += width * between(row.gap[0], row.gap[1]);
        }
        return { back: row.back, list };
      });

      // Drop any tree that is mostly hidden: one that other trees drawn over it (the next ones along its row, and
      // for the back row the whole front row) cover more than a third of. A tree is judged block by block.
      const baseY = Math.round(view.h) + 2;
      const left = t => Math.round(t.x - t.width / 2);
      const covers = (o, px, py) => {
        const col = Math.floor((px - left(o)) / o.block);
        const r = Math.floor((py - (baseY - o.height)) / o.block);
        return col >= 0 && col < SPRUCE_COLS && r >= 0 && r < SPRUCE_ROWS && SPRUCE[r][col] !== '.';
      };
      const visible = (t, over) => {
        let seen = 0, total = 0;
        SPRUCE.forEach((line, r) => {
          for (let col = 0; col < SPRUCE_COLS; col++) {
            if (line[col] === '.') continue;
            total++;
            const px = left(t) + (col + 0.5) * t.block;
            const py = baseY - t.height + (r + 0.5) * t.block;
            if (!over.some(o => covers(o, px, py))) seen++;
          }
        });
        return seen / total;
      };
      const front = trees[1].list;
      for (let i = 0; i < front.length; i++) {
        if (visible(front[i], front.slice(i + 1)) < 0.67) { front.splice(i, 1); i--; }
      }
      const back = trees[0].list;
      for (let i = 0; i < back.length; i++) {
        if (visible(back[i], back.slice(i + 1).concat(front)) < 0.67) { back.splice(i, 1); i--; }
      }
    }

    function drawTrees(ctx, light) {
      layoutTrees();
      const mode = light ? 'light' : 'dark';
      const colours = LIGHT_COLOURS[mode];
      const baseY = Math.round(view.h) + 2;
      ctx.imageSmoothingEnabled = false;
      trees.forEach(row => {
        row.list.forEach(t => {
          ctx.drawImage(spruceTexture(mode, row.back), Math.round(t.x - t.width / 2), baseY - t.height, t.width, t.height);
        });
      });

      // the square lights on the front row
      const side = Math.max(2, Math.round(3.5 * unit()));
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      trees[1].list.forEach(t => {
        t.bulbs.forEach(b => {
          const level = 0.6 + 0.4 * Math.sin(clock * (0.6 + (b.i % 5) * 0.2) + b.i * 2.1);
          bulb(ctx, t.x + b.dx, baseY + b.dy, side, side * 3, colours[b.i % colours.length], level, light);
        });
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
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
      const side = Math.max(2, Math.round(6 * u));
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
          bulbs.push([px, py + side * 0.6, index++]);
        }
      }

      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      bulbs.forEach(([x, y, i]) => {
        // slow, smooth swell and fade: a bulb takes several seconds to go from bright to dim
        const level = 0.6 + 0.4 * Math.sin(clock * (0.7 + (i % 5) * 0.17) + i * 2.4);
        bulb(ctx, x, y, side, side * 3, colours[i % colours.length], level, light);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function draw(ctx) {
      const light = isLight();
      drawTrees(ctx, light);
      drawLights(ctx, light);

      const rgb = SPARKLE_COLOURS[light ? 'light' : 'dark'];
      sparkles.forEach(p => {
        const fade = Math.sin(Math.PI * Math.min(1, p.age / p.life));
        const twinkle = 0.55 + 0.45 * Math.sin(clock * p.twinkle * 2 + p.phase);
        ctx.fillStyle = `rgb(${rgb})`;
        ctx.globalAlpha = Math.max(0, fade * twinkle * (light ? 0.8 : 0.95));
        plus(ctx, p.x + Math.sin(clock * p.swaySpeed + p.phase) * p.sway, p.y, p.size * 0.55);
      });
      ctx.globalAlpha = 1;
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

    // The bat's shape: the same wings, body, head and ears as ever, drawn smooth at the origin. flap runs from -1
    // (wings down) to 1 (wings up). Every part is filled on its own: parts drawn as one path cancel each other out
    // where they overlap and leave holes.
    function batShape(ctx, s, flap) {
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
      // The head is a small square and each ear a short square column on its top corners, so that at pixel size
      // they read as a head with ears (a round head and pointed ears would make a plus). Measured in 1/14 of s.
      const q = s / 14;
      ctx.fillRect(-2 * q, -5 * q, 4 * q, 3 * q);
      ctx.fillRect(-2 * q, -7 * q, q, 2 * q);
      ctx.fillRect(q, -7 * q, q, 2 * q);
    }

    /* Drawn pixelated: the shape above is drawn small onto a tiny canvas, every part-covered pixel is made fully
       solid (and the rest fully clear, so there is no soft edge), and that is scaled up with smoothing off so each
       pixel shows as a crisp square. Flap is rounded to a few steps, so the wings move in jumps like the game's, and
       each step is made once per colour and kept. */
    const BAT_GRID = 14;                  // half the wingspan, in bat pixels
    const BAT_W = BAT_GRID * 2 + 4, BAT_H = BAT_GRID * 2 - 4;
    const batSprites = {};
    function batSprite(colour, step) {
      const key = colour + '|' + step;
      if (batSprites[key]) return batSprites[key];
      const c = document.createElement('canvas');
      c.width = BAT_W;
      c.height = BAT_H;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.fillStyle = colour;
      g.translate(BAT_W / 2, BAT_H / 2);
      batShape(g, BAT_GRID, step / 4);
      const img = g.getImageData(0, 0, BAT_W, BAT_H);
      for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] >= 110 ? 255 : 0;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.putImageData(img, 0, 0);
      return (batSprites[key] = c);
    }

    // s is the bat's half-wingspan on screen; the bat is centred on (x, y).
    function drawBat(ctx, x, y, s, flap, colour) {
      const u = Math.max(1, Math.round(s / BAT_GRID));  // screen pixels per bat pixel
      const step = Math.max(-4, Math.min(4, Math.round(flap * 4)));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(batSprite(colour, step), Math.round(x) - Math.floor(BAT_W / 2) * u, Math.round(y) - Math.floor(BAT_H / 2) * u, BAT_W * u, BAT_H * u);
    }

    function draw(ctx) {
      const light = isLight();
      const glowRgb = EMBER_COLOURS[light ? 'light' : 'dark'];

      // The moon, large and hazy, high on the right (bats cross in front of it): a pale square with faint
      // square craters inside a soft round glow of the same colour.
      const mr = Math.round(Math.min(view.w, view.h) * 0.13 + 6);
      const mx = Math.round(view.w * 0.8);
      const my = Math.round(view.h * 0.22);
      const haloRgb = light ? '222, 196, 130' : '255, 243, 210';
      const halo = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 3.2);
      halo.addColorStop(0, `rgba(${haloRgb}, ${light ? 0.34 : 0.2})`);
      halo.addColorStop(1, `rgba(${haloRgb}, 0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(mx - mr * 3.2, my - mr * 3.2, mr * 6.4, mr * 6.4);
      ctx.fillStyle = light ? 'rgba(206, 190, 148, 0.55)' : 'rgba(238, 234, 218, 0.3)';
      ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
      ctx.fillStyle = light ? 'rgba(120, 100, 60, 0.12)' : 'rgba(60, 64, 90, 0.2)';
      [[-0.32, -0.28, 0.2], [0.28, -0.05, 0.14], [-0.1, 0.38, 0.17], [0.38, 0.4, 0.09]].forEach(([dx, dy, r]) => {
        const side = Math.max(1, Math.round(r * mr * 2));
        ctx.fillRect(Math.round(mx + dx * mr - side / 2), Math.round(my + dy * mr - side / 2), side, side);
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
        const side = Math.max(1, Math.round(e.size * 2));
        ctx.fillRect(Math.round(e.x + Math.sin(clock * e.swaySpeed + e.phase) * e.sway - side / 2), Math.round(e.y - side / 2), side, side);
      });

      // Solid colours only (the sprite is made once per colour); the light theme's is the old 0.8-alpha purple
      // worked out against a pale page.
      const batColour = light ? 'rgb(82, 70, 101)' : 'rgb(58, 38, 88)';
      bats.forEach(b => {
        const flap = b.flap ?? Math.sin(clock * b.flapSpeed + b.phase);
        drawBat(ctx, b.x, b.y + b.base, b.size, flap, batColour);
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

  /* ---------- Minecraft-style leaf texture (Falling Leaves and Cherry Blossom) ---------- */

  /* Two flat squares, each a 2x2 grid of pixels, that share one pixel where their corners meet. Together
     they make a 3x3 texture: the first square is the top-left 2x2, the second the bottom-right 2x2, they
     overlap in the middle, and the bottom-right pixel (opposite the overlap on the second square) is a touch
     darker. Drawn with smoothing off so the edges stay crisp as it spins. colours = { base, dark }. */
  const pixelLeafCache = {};
  function pixelLeaf(colours) {
    const key = colours.base + colours.dark;
    if (pixelLeafCache[key]) return pixelLeafCache[key];
    const c = document.createElement('canvas');
    c.width = c.height = 3;
    const g = c.getContext('2d');
    g.fillStyle = colours.base;
    g.fillRect(0, 0, 2, 2);
    g.fillRect(1, 1, 2, 2);
    g.fillStyle = colours.dark;
    g.fillRect(2, 2, 1, 1);
    return (pixelLeafCache[key] = c);
  }

  /* ---------- Falling Leaves ---------- */

  /* The same leaf as Cherry Blossom's, in browns: a lighter, more common one and a slightly darker one
     that appears about one time in five. The light theme needs deeper browns to stand out against a pale page. */
  const AUTUMN_BROWNS = {
    dark:  [{ base: '#b9722c', dark: '#9a5821' }, { base: '#9a5a26', dark: '#7a4217' }],
    light: [{ base: '#9a5a1f', dark: '#7a4113' }, { base: '#7c4519', dark: '#5d300e' }]
  };

  function createLeaves(view) {
    let leaves = [];
    let clock = 0;

    const unit = () => view.scale !== undefined ? view.scale * 1.6 : Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const wanted = () => view.leaves ?? Math.round(Math.min(48, Math.max(14, (view.w * view.h) / 24000)));

    function leaf(anywhere) {
      const size = rand(14, 26) * unit();
      return {
        x: rand(0, view.w), y: anywhere ? rand(0, view.h) : rand(-30, -4),
        size, deep: random() < DEEP_LEAF_CHANCE,
        fall: rand(28, 52) * unit() + 10, // a leaf drifts down more slowly than rain, a little faster when larger
        sway: rand(14, 40) * unit(), swaySpeed: rand(0.35, 0.9), phase: rand(0, TAU),
        angle: rand(0, TAU), spin: rand(-1.2, 1.2),
        alpha: 1
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
      const palette = AUTUMN_BROWNS[isLight() ? 'light' : 'dark'];
      ctx.imageSmoothingEnabled = false;
      leaves.forEach(l => {
        const s = l.size;
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);
        ctx.globalAlpha = l.alpha;
        ctx.drawImage(pixelLeaf(palette[l.deep ? 1 : 0]), -s / 2, -s / 2, s, s);
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

  /* Minecraft's cherry-leaf particle: see pixelLeaf above for the shape. Pink, spinning as it falls. About one
     leaf in five is a slightly darker pink. The light theme uses deeper pinks. */
  const LEAF_PINKS = {
    dark:  [{ base: '#f2b4d6', dark: '#e18ab8' }, { base: '#e49ac3', dark: '#d070a6' }],
    light: [{ base: '#e0709a', dark: '#c04c7c' }, { base: '#cc5483', dark: '#ae3868' }]
  };
  const DEEP_LEAF_CHANCE = 0.2; // the second, slightly darker leaf is the rarer one

  function createBlossom(view) {
    let petals = [];
    let clock = 0;

    const unit = () => view.scale !== undefined ? view.scale * 1.6 : Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const wanted = () => view.petals ?? Math.round(Math.min(70, Math.max(22, (view.w * view.h) / 14000)));

    function petal(anywhere) {
      return {
        x: rand(-20, view.w + 20), y: anywhere ? rand(0, view.h) : rand(-30, -4),
        size: rand(14, 26) * unit(),
        fall: rand(18, 36) * unit() + 8, // slower than leaves: petals float
        drift: rand(6, 16) * unit(),       // a steady push to one side, like a light breeze
        sway: rand(14, 34) * unit(), swaySpeed: rand(0.3, 0.8), phase: rand(0, TAU),
        angle: rand(0, TAU), spin: rand(-1.6, 1.6),
        alpha: 1, deep: random() < DEEP_LEAF_CHANCE
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
      const palette = LEAF_PINKS[isLight() ? 'light' : 'dark'];
      ctx.imageSmoothingEnabled = false;
      petals.forEach(p => {
        const s = p.size;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.alpha;
        ctx.drawImage(pixelLeaf(palette[p.deep ? 1 : 0]), -s / 2, -s / 2, s, s);
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

  /* ---------- Easter ---------- */

  // Each egg is [base, decoration]. Soft pastels on dark pages; deeper ones on the light theme so they still show.
  const EGG_COLOURS = {
    dark: [
      ['#ffb3c7', '#fff3b0'], ['#b9e4ff', '#ffffff'], ['#c9b6ff', '#ffe0f0'],
      ['#b8f0c8', '#fff8c4'], ['#ffd3a1', '#ffffff'], ['#fff1a8', '#ffc2d9']
    ],
    light: [
      ['#e8749c', '#fff1f6'], ['#4aa3df', '#e8f5ff'], ['#8c6be0', '#efe9ff'],
      ['#3fae6a', '#e6f8ec'], ['#e08a3c', '#fff1e0'], ['#d1a400', '#fff7cc']
    ]
  };
  // Daisies among the eggs: [petals, centre].
  const DAISY_COLOURS = { dark: ['#ffffff', '#ffd54a'], light: ['#ee8fb0', '#d89a00'] };

  function createEaster(view) {
    let items = [];
    let clock = 0;

    const unit = () => view.scale !== undefined ? view.scale * 1.6 : Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const wanted = () => view.eggs ?? Math.round(Math.min(34, Math.max(12, (view.w * view.h) / 30000)));

    function item(anywhere) {
      const daisy = random() < 0.3;
      return {
        daisy,
        x: rand(-20, view.w + 20), y: anywhere ? rand(0, view.h) : rand(-40, -10),
        size: (daisy ? rand(6, 9) : rand(11, 16)) * unit(),
        colour: Math.floor(random() * EGG_COLOURS.dark.length),
        pattern: Math.floor(random() * 4),
        fall: rand(16, 32) * unit() + 8, // eggs drift down gently, like the petals
        drift: rand(-5, 9) * unit(),
        sway: rand(10, 26) * unit(), swaySpeed: rand(0.3, 0.7), phase: rand(0, TAU),
        angle: rand(0, TAU), spin: rand(-1.2, 1.2), // daisies turn; eggs rock instead
        rock: rand(0.5, 1.1), tumble: rand(0.8, 1.8), alpha: rand(0.78, 0.95)
      };
    }

    function fill(anywhere) {
      const count = wanted();
      while (items.length < count) items.push(item(anywhere));
      if (items.length > count) items.length = count;
    }

    function step(dt) {
      clock += dt;
      fill(false);
      items.forEach(p => {
        p.y += p.fall * dt;
        p.x += (p.drift + Math.sin(clock * p.swaySpeed + p.phase) * p.sway) * dt;
        p.angle += p.spin * dt;
        if (p.y > view.h + p.size * 2) Object.assign(p, item(false));
        if (p.x > view.w + 30) p.x = -30; else if (p.x < -30) p.x = view.w + 30;
      });
    }

    /* Pixel art, drawn small and scaled up with smoothing off (as the snow and leaves are) so every pixel is a crisp
       square. The egg is Minecraft's: 10 pixels wide and 12 tall, narrow at the top and widest low down, with a darker
       edge, a lit patch at the upper left, a shaded lower right and the decoration in its second colour. # is the egg,
       . is empty. */
    const EGG_SHAPE = [
      '..........',
      '...####...',
      '..######..',
      '.########.',
      '.########.',
      '##########',
      '##########',
      '##########',
      '##########',
      '##########',
      '.########.',
      '..######..'
    ];
    const EGG_W = EGG_SHAPE[0].length, EGG_H = EGG_SHAPE.length;
    const EGG_SHINE = [[3, 2], [2, 3], [3, 3]];
    // The decoration of each pattern, as [x, y] pixels inside the egg.
    const EGG_PATTERNS = [
      [[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8]],  // two bands
      [[2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [2, 6], [3, 7], [4, 6], [5, 7], [6, 6], [7, 7]],  // a band over a zigzag
      [[5, 3], [3, 5], [6, 5], [4, 7], [7, 7], [5, 9]],                                                  // dots
      [[2, 6], [3, 5], [4, 5], [5, 6], [6, 6], [7, 5], [3, 9], [4, 9], [5, 9], [6, 9]]                   // a wave
    ];
    const eggSprites = {};
    function eggSprite(mode, colour, pattern) {
      const key = mode + colour + pattern;
      if (eggSprites[key]) return eggSprites[key];
      const [base, trim] = EGG_COLOURS[mode][colour % EGG_COLOURS[mode].length];
      const c = document.createElement('canvas');
      c.width = EGG_W;
      c.height = EGG_H;
      const g = c.getContext('2d');
      const solid = (x, y) => !!EGG_SHAPE[y] && EGG_SHAPE[y][x] === '#';
      const edge = (x, y) => !(solid(x - 1, y) && solid(x + 1, y) && solid(x, y - 1) && solid(x, y + 1));
      const baseRgb = hexRgb(base);
      const outline = mixRgb(baseRgb, [0, 0, 0], 0.3);
      const shade = mixRgb(baseRgb, [0, 0, 0], 0.12);
      EGG_SHAPE.forEach((row, y) => {
        for (let x = 0; x < EGG_W; x++) {
          if (!solid(x, y)) continue;
          g.fillStyle = edge(x, y) ? outline : (x + y >= 15 ? shade : base);
          g.fillRect(x, y, 1, 1);
        }
      });
      g.fillStyle = trim;
      EGG_PATTERNS[pattern % EGG_PATTERNS.length].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
      g.fillStyle = 'rgba(255, 255, 255, 0.55)';
      EGG_SHINE.forEach(([x, y]) => g.fillRect(x, y, 1, 1));
      return (eggSprites[key] = c);
    }

    // The daisy: a plus of square petals with a ring of square petals between and a yellow centre, 5 pixels across.
    const DAISY_SHAPE = [
      '..P..',
      '.PPP.',
      'PPCPP',
      '.PPP.',
      '..P..'
    ];
    const daisySprites = {};
    function daisySprite(mode) {
      if (daisySprites[mode]) return daisySprites[mode];
      const [petal, centre] = DAISY_COLOURS[mode];
      const c = document.createElement('canvas');
      c.width = c.height = 5;
      const g = c.getContext('2d');
      DAISY_SHAPE.forEach((row, y) => {
        for (let x = 0; x < 5; x++) {
          if (row[x] === '.') continue;
          g.fillStyle = row[x] === 'C' ? centre : petal;
          g.fillRect(x, y, 1, 1);
        }
      });
      return (daisySprites[mode] = c);
    }

    // An egg rocks as it falls. p.size is its half-height, so a pixel of the egg is a sixth of that.
    function drawEgg(ctx, p, mode) {
      const px = Math.max(1, Math.round(p.size / 6));
      ctx.rotate(Math.sin(clock * p.rock + p.phase) * 0.5);
      ctx.drawImage(eggSprite(mode, p.colour, p.pattern), -EGG_W / 2 * px, -EGG_H / 2 * px, EGG_W * px, EGG_H * px);
    }

    // A daisy just turns, with no squashing. p.size is its half-width, so a pixel of the daisy is two fifths of that.
    function drawDaisy(ctx, p, mode) {
      const px = Math.max(1, Math.round(p.size * 0.4));
      ctx.rotate(p.angle);
      ctx.drawImage(daisySprite(mode), -2.5 * px, -2.5 * px, 5 * px, 5 * px);
    }

    function draw(ctx) {
      const mode = isLight() ? 'light' : 'dark';
      ctx.imageSmoothingEnabled = false;
      items.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = p.alpha;
        if (p.daisy) drawDaisy(ctx, p, mode); else drawEgg(ctx, p, mode);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    }

    function still() { items = []; clock = 2; fill(true); }

    fill(true);

    function resize(oldW, oldH) {
      if (!oldW || !oldH) return;
      items.forEach(p => { p.x = (p.x / oldW) * view.w; p.y = (p.y / oldH) * view.h; });
    }

    return { step, draw, still, resize };
  }

  /* ---------- Anniversary ---------- */

  // Bright party colours; deeper on the light theme so they read against a pale page.
  const FOOL_COLOURS = {
    dark:  ['#ff5d9e', '#ffd23f', '#3fe0ff', '#a56bff', '#5ef08a', '#ff8a3d'],
    light: ['#d81b6a', '#c99700', '#0a8fb5', '#7a3fe0', '#1b9a4a', '#e0661a']
  };

  // A party: confetti falls while the balloons float up the page.
  function createAnniversary(view) {
    let bits = [];
    let balloons = [];
    let clock = 0;

    const unit = () => view.scale !== undefined ? view.scale * 1.6 : Math.min(1.25, Math.max(0.6, Math.min(view.w, view.h) / 760));
    const wantedBits = () => view.confetti ?? Math.round(Math.min(80, Math.max(28, (view.w * view.h) / 12000)));
    const wantedBalloons = () => view.balloons ?? Math.round(Math.min(9, Math.max(4, view.w / 170)));

    function bit(anywhere) {
      return {
        x: rand(-10, view.w + 10), y: anywhere ? rand(0, view.h) : rand(-20, -4),
        size: rand(4, 8) * unit(), colour: Math.floor(random() * FOOL_COLOURS.dark.length),
        shape: Math.floor(random() * 4),
        fall: rand(45, 95) * unit() + 15,
        sway: rand(8, 24) * unit(), swaySpeed: rand(0.6, 1.6), phase: rand(0, TAU),
        angle: rand(0, TAU), spin: rand(-3, 3), tumble: rand(2, 5)
      };
    }

    function balloon(anywhere) {
      const r = rand(13, 20) * unit();
      return {
        x: view.w * marginX(0.65), y: anywhere ? rand(0, view.h) : view.h + r * 4,
        r, colour: Math.floor(random() * FOOL_COLOURS.dark.length),
        rise: rand(26, 46) * unit() + 12,
        sway: rand(10, 22) * unit(), swaySpeed: rand(0.4, 0.8), phase: rand(0, TAU)
      };
    }

    function fill(anywhere) {
      const nb = wantedBits();
      while (bits.length < nb) bits.push(bit(anywhere));
      if (bits.length > nb) bits.length = nb;
      const nl = wantedBalloons();
      while (balloons.length < nl) balloons.push(balloon(anywhere));
      if (balloons.length > nl) balloons.length = nl;
    }

    const swayX = (p, base) => base + Math.sin(clock * p.swaySpeed + p.phase) * p.sway;

    function step(dt) {
      clock += dt;
      fill(false);
      bits.forEach(p => {
        p.y += p.fall * dt;
        p.angle += p.spin * dt;
        if (p.y > view.h + 12) Object.assign(p, bit(false));
      });
      balloons.forEach(b => {
        b.y -= b.rise * dt;
        if (b.y < -b.r * 5) Object.assign(b, balloon(false));
      });
    }

    /* Everything here is built from whole-pixel squares. A confetti piece is a few squares (a bar, a square, two
       squares on a diagonal, or a stepped squiggle) that turns in quarter turns instead of squashing, so its edges
       stay sharp. A balloon is a small pixel sprite scaled up with smoothing off, with a pixel string trailing from
       it. */
    function drawBit(ctx, p, palette) {
      const px = Math.max(1, Math.round(p.size * 0.42));
      ctx.save();
      ctx.translate(Math.round(swayX(p, p.x)), Math.round(p.y));
      ctx.rotate(Math.round(p.angle / (Math.PI / 2)) * Math.PI / 2);
      ctx.fillStyle = palette[p.colour % palette.length];
      const cell = (x, y, w, h) => ctx.fillRect(x * px, y * px, w * px, h * px);
      if (p.shape === 0) {
        cell(-1, -2, 2, 4);
      } else if (p.shape === 1) {
        cell(-1, -1, 2, 2);
      } else if (p.shape === 2) {
        cell(-2, -2, 2, 2); cell(0, 0, 2, 2);
      } else {
        [[0, -3], [1, -2], [0, -1], [-1, 0], [0, 1], [1, 2]].forEach(([x, y]) => cell(x, y, 1, 1));
      }
      ctx.restore();
    }

    // The balloon: a squared-off round shape with a knot, a darker lower right and a shine at the upper left.
    const BALLOON_SHAPE = [
      '.######.',
      '########',
      '########',
      '########',
      '########',
      '########',
      '.######.',
      '..####..',
      '...##...'
    ];
    const BALLOON_W = 8, BALLOON_H = BALLOON_SHAPE.length;
    const balloonSprites = {};
    function balloonSprite(colour) {
      if (balloonSprites[colour]) return balloonSprites[colour];
      const c = document.createElement('canvas');
      c.width = BALLOON_W;
      c.height = BALLOON_H;
      const g = c.getContext('2d');
      const shade = mixRgb(hexRgb(colour), [0, 0, 0], 0.15);
      BALLOON_SHAPE.forEach((row, y) => {
        for (let x = 0; x < BALLOON_W; x++) {
          if (row[x] !== '#') continue;
          g.fillStyle = x + y >= 10 ? shade : colour;
          g.fillRect(x, y, 1, 1);
        }
      });
      g.fillStyle = 'rgba(255, 255, 255, 0.45)';
      g.fillRect(1, 1, 1, 1); g.fillRect(2, 1, 1, 1); g.fillRect(1, 2, 1, 1);
      return (balloonSprites[colour] = c);
    }

    function drawBalloon(ctx, b, palette, light) {
      const px = Math.max(1, Math.round(b.r * 0.22));
      const x = Math.round(swayX(b, b.x));
      const top = Math.round(b.y - BALLOON_H * px / 2);
      const left = x - BALLOON_W / 2 * px;
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(balloonSprite(palette[b.colour % palette.length]), left, top, BALLOON_W * px, BALLOON_H * px);
      // The string: a line of single squares that sways a pixel either way as it trails down.
      ctx.globalAlpha = 1;
      ctx.fillStyle = light ? 'rgba(40, 50, 80, 0.55)' : 'rgba(255, 255, 255, 0.5)';
      const links = Math.max(4, Math.round(b.r * 2.4 / px));
      for (let i = 0; i < links; i++) {
        const dx = Math.round(1.2 * Math.sin(clock * 1.2 + b.phase + i * 0.7) * Math.min(1, i / 3));
        ctx.fillRect(x + dx * px - Math.floor(px / 2), top + BALLOON_H * px + i * px, px, px);
      }
    }

    function draw(ctx) {
      const light = isLight();
      const palette = FOOL_COLOURS[light ? 'light' : 'dark'];
      ctx.globalAlpha = 0.9;
      bits.forEach(p => drawBit(ctx, p, palette));
      ctx.globalAlpha = 1;
      balloons.forEach(b => drawBalloon(ctx, b, palette, light));
      ctx.globalAlpha = 1;
    }

    function still() { bits = []; balloons = []; clock = 1; fill(true); }

    fill(true);

    function resize(oldW, oldH) {
      if (!oldW || !oldH) return;
      const fix = p => { p.x = (p.x / oldW) * view.w; p.y = (p.y / oldH) * view.h; };
      bits.forEach(fix); balloons.forEach(fix);
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
        // The soft round glow, with a square firefly at its centre.
        const side = Math.max(2, Math.round(f.size * 2));
        const cx = Math.round(f.x), cy = Math.round(f.y);
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
        ctx.fillRect(cx - Math.round(side / 2), cy - Math.round(side / 2), side, side);
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

  const EFFECTS = { fireworks: createFireworks, aurora: createAurora, anniversary: createAnniversary, blossom: createBlossom, easter: createEaster, fireflies: createFireflies, friday13: createFriday13, halloween: createHalloween, leaves: createLeaves, snowfall: createSnow, christmas: createChristmas };

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

  // Tell the stylesheet where the footer's top edge is on screen, so the canvas can fade out behind it.
  let footerFrame = 0;
  function trackFooter() {
    footerFrame = 0;
    const footer = document.querySelector('.site-footer');
    const root = document.documentElement.style;
    if (!footer) { root.removeProperty('--footer-top'); return; }
    root.setProperty('--footer-top', Math.round(footer.getBoundingClientRect().top) + 'px');
  }
  function queueFooter() { if (!footerFrame) footerFrame = requestAnimationFrame(trackFooter); }
  window.addEventListener('scroll', queueFooter, { passive: true });
  window.addEventListener('resize', queueFooter);
  window.addEventListener('load', queueFooter);
  if (typeof ResizeObserver === 'function') new ResizeObserver(queueFooter).observe(document.documentElement);
  queueFooter();

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
    const pview = { w: 0, h: 0, dpr: 1, scale: 0.3, line: 0.6, flakes: 14, mist: 3, glyphs: 4, bats: 2, flies: 8, eggs: 13, confetti: 22, balloons: 5, embers: 7, sparkles: 6, lightsTop: 0, flashEvery: [2.0, 3.5] }; // flashEvery: Friday 13th's bolts, far more often than on the page
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
      random = seeded({ fireworks: 11, aurora: 7, blossom: 3, anniversary: 4, easter: 9, fireflies: 18, snowfall: 5, christmas: 25, halloween: 31, leaves: 23, friday13: 13 }[season] || 5);
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
