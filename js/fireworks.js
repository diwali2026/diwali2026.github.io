/**
 * Diwali landing fireworks — no external libraries.
 * Slow-motion, kid-friendly bursts; click/tap to launch; Web Audio pops (mute default).
 */
(function () {
  "use strict";

  const canvas = document.getElementById("fx-canvas");
  const bgCanvas = document.getElementById("bg-canvas");
  if (!canvas || !bgCanvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const bg = bgCanvas.getContext("2d");

  const reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, dpr = 1;
  let rockets = [];
  let particles = [];
  let fountains = [];
  let sparklers = [];
  let stars = [];
  let last = 0;
  let autoTimer = 0;
  let running = true;
  let soundOn = false;
  let audioCtx = null;

  const COLORS = [
    "#ff6b6b", "#ffd93d", "#6bcBFF", "#ff9ff3", "#7bed9f",
    "#ffa502", "#a29bfe", "#ff7675", "#55efc4", "#ffeaa7",
    "#fd79a8", "#74b9ff", "#fdcb6e", "#e17055"
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    for (const c of [canvas, bgCanvas]) {
      c.width = Math.floor(W * dpr);
      c.height = Math.floor(H * dpr);
      c.style.width = W + "px";
      c.style.height = H + "px";
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bg.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintBackground();
    if (!stars.length) initStars();
  }

  function initStars() {
    stars = [];
    const n = Math.floor((W * H) / 9000);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.65,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.6 + 0.2,
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  function paintBackground() {
    const g = bg.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#050218");
    g.addColorStop(0.45, "#1a0a2e");
    g.addColorStop(0.72, "#3d1a4a");
    g.addColorStop(1, "#6b2a1a");
    bg.fillStyle = g;
    bg.fillRect(0, 0, W, H);

    // soft moon glow
    const mx = W * 0.78, my = H * 0.16;
    const moon = bg.createRadialGradient(mx, my, 0, mx, my, 90);
    moon.addColorStop(0, "rgba(255,245,200,0.9)");
    moon.addColorStop(0.35, "rgba(255,230,160,0.35)");
    moon.addColorStop(1, "rgba(255,200,100,0)");
    bg.fillStyle = moon;
    bg.beginPath();
    bg.arc(mx, my, 90, 0, Math.PI * 2);
    bg.fill();
    bg.fillStyle = "#fff6d5";
    bg.beginPath();
    bg.arc(mx, my, 22, 0, Math.PI * 2);
    bg.fill();

    // stars
    for (const s of stars) {
      bg.fillStyle = `rgba(255,255,255,${s.a})`;
      bg.beginPath();
      bg.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bg.fill();
    }

    // distant hills
    bg.fillStyle = "#12081c";
    bg.beginPath();
    bg.moveTo(0, H * 0.72);
    bg.quadraticCurveTo(W * 0.25, H * 0.62, W * 0.5, H * 0.7);
    bg.quadraticCurveTo(W * 0.75, H * 0.78, W, H * 0.66);
    bg.lineTo(W, H);
    bg.lineTo(0, H);
    bg.closePath();
    bg.fill();

    // town silhouette + glowing windows / diyas
    const groundY = H * 0.78;
    bg.fillStyle = "#0a0610";
    bg.beginPath();
    bg.moveTo(0, H);
    bg.lineTo(0, groundY + 20);
    // skyline
    const buildings = [];
    let x = -20;
    while (x < W + 40) {
      const bw = 28 + Math.random() * 55;
      const bh = 40 + Math.random() * 110;
      buildings.push({ x, bw, bh });
      x += bw + 4 + Math.random() * 18;
    }
    for (const b of buildings) {
      const top = groundY + 30 - b.bh;
      bg.fillRect(b.x, top, b.bw, b.bh + (H - groundY));
      // dome / temple-ish tops occasionally
      if (b.bw > 50 && Math.random() > 0.6) {
        bg.beginPath();
        bg.arc(b.x + b.bw / 2, top, b.bw * 0.28, Math.PI, 0);
        bg.fill();
        bg.fillRect(b.x + b.bw / 2 - 3, top - b.bw * 0.45, 6, b.bw * 0.25);
      }
    }
    // glowing windows
    for (const b of buildings) {
      const top = groundY + 30 - b.bh;
      for (let wy = top + 12; wy < groundY + 10; wy += 16) {
        for (let wx = b.x + 6; wx < b.x + b.bw - 8; wx += 12) {
          if (Math.random() > 0.55) {
            bg.fillStyle = Math.random() > 0.3 ? "rgba(255,200,80,0.75)" : "rgba(255,140,40,0.55)";
            bg.fillRect(wx, wy, 5, 7);
          }
        }
      }
    }
    // diya row along street
    for (let i = 0; i < W; i += 18) {
      const dy = groundY + 38 + Math.sin(i * 0.05) * 3;
      const glow = bg.createRadialGradient(i, dy, 0, i, dy, 10);
      glow.addColorStop(0, "rgba(255,180,40,0.9)");
      glow.addColorStop(1, "rgba(255,100,0,0)");
      bg.fillStyle = glow;
      bg.beginPath();
      bg.arc(i, dy, 10, 0, Math.PI * 2);
      bg.fill();
      bg.fillStyle = "#ffcc66";
      bg.beginPath();
      bg.ellipse(i, dy + 2, 4, 2.2, 0, 0, Math.PI * 2);
      bg.fill();
    }

    // ground gradient
    const gg = bg.createLinearGradient(0, groundY + 20, 0, H);
    gg.addColorStop(0, "rgba(20,8,10,0)");
    gg.addColorStop(1, "rgba(40,15,10,0.85)");
    bg.fillStyle = gg;
    bg.fillRect(0, groundY + 20, W, H - groundY);
  }

  function randColor() {
    return COLORS[(Math.random() * COLORS.length) | 0];
  }

  function playPop(vol) {
    if (!soundOn) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(420 + Math.random() * 280, t);
      o.frequency.exponentialRampToValueAtTime(80, t + 0.18);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime((vol || 0.08) * 0.5, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(t);
      o.stop(t + 0.25);
      // soft noise-ish sparkle with second osc
      const o2 = audioCtx.createOscillator();
      const g2 = audioCtx.createGain();
      o2.type = "sine";
      o2.frequency.value = 900 + Math.random() * 600;
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(0.02, t + 0.005);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o2.connect(g2);
      g2.connect(audioCtx.destination);
      o2.start(t);
      o2.stop(t + 0.15);
    } catch (_) { /* ignore */ }
  }

  function launchRocket(x, y) {
    const targetY = y != null ? y : H * (0.15 + Math.random() * 0.28);
    rockets.push({
      x: x != null ? x : W * (0.15 + Math.random() * 0.7),
      y: H * 0.86,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -4.2 - Math.random() * 1.8, // slow rise
      targetY,
      color: randColor(),
      trail: [],
      kind: Math.random() > 0.35 ? "burst" : "ring",
    });
  }

  function explode(x, y, color, kind) {
    playPop(0.12);
    const n = kind === "ring" ? 48 : 70 + ((Math.random() * 40) | 0);
    for (let i = 0; i < n; i++) {
      const angle = kind === "ring"
        ? (i / n) * Math.PI * 2
        : Math.random() * Math.PI * 2;
      const speed = kind === "ring"
        ? 1.6 + Math.random() * 0.6
        : 0.6 + Math.random() * 2.8;
      // slow-motion: lower speeds
      const slow = 0.55;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed * slow,
        vy: Math.sin(angle) * speed * slow,
        life: 1,
        decay: 0.004 + Math.random() * 0.006, // linger
        color: Math.random() > 0.25 ? color : randColor(),
        size: 1.5 + Math.random() * 2.2,
        glitter: Math.random() > 0.5,
        gravity: 0.012,
      });
    }
    // extra glitter sparkles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.4 * 0.55;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.008 + Math.random() * 0.01,
        color: "#fff8dc",
        size: 0.8 + Math.random(),
        glitter: true,
        gravity: 0.008,
      });
    }
  }

  function startFountain(x) {
    fountains.push({
      x: x != null ? x : W * (0.2 + Math.random() * 0.6),
      y: H * 0.84,
      life: 2.8 + Math.random() * 1.5,
      age: 0,
      color: randColor(),
    });
    playPop(0.05);
  }

  function startSparkler(x, y) {
    sparklers.push({
      x: x != null ? x : W * (0.3 + Math.random() * 0.4),
      y: y != null ? y : H * 0.7,
      life: 2.2,
      age: 0,
      color: randColor(),
    });
  }

  function spawnAuto() {
    if (reduced) return;
    const r = Math.random();
    if (r < 0.55) launchRocket();
    else if (r < 0.8) startFountain();
    else startSparkler();
  }

  function update(dt) {
    // rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.trail.push({ x: r.x, y: r.y, life: 1 });
      if (r.trail.length > 14) r.trail.shift();
      for (const t of r.trail) t.life -= 0.08;
      r.x += r.vx * dt * 60;
      r.y += r.vy * dt * 60;
      r.vy += 0.018 * dt * 60; // gentle gravity
      if (r.y <= r.targetY || r.vy >= -0.3) {
        explode(r.x, r.y, r.color, r.kind);
        rockets.splice(i, 1);
      }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.gravity * dt * 60;
      p.vx *= 0.995;
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= p.decay * dt * 60;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // fountains (anaar)
    for (let i = fountains.length - 1; i >= 0; i--) {
      const f = fountains[i];
      f.age += dt;
      if (f.age > f.life) {
        fountains.splice(i, 1);
        continue;
      }
      // emit sparks upward
      for (let k = 0; k < 3; k++) {
        particles.push({
          x: f.x + (Math.random() - 0.5) * 8,
          y: f.y,
          vx: (Math.random() - 0.5) * 0.9,
          vy: -2.2 - Math.random() * 2.4,
          life: 1,
          decay: 0.012 + Math.random() * 0.01,
          color: Math.random() > 0.3 ? f.color : "#ffeaa7",
          size: 1.2 + Math.random() * 1.8,
          glitter: true,
          gravity: 0.04,
        });
      }
    }

    // sparklers
    for (let i = sparklers.length - 1; i >= 0; i--) {
      const s = sparklers[i];
      s.age += dt;
      if (s.age > s.life) {
        sparklers.splice(i, 1);
        continue;
      }
      for (let k = 0; k < 5; k++) {
        const a = Math.random() * Math.PI * 2;
        const sp = Math.random() * 1.8;
        particles.push({
          x: s.x,
          y: s.y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          decay: 0.04 + Math.random() * 0.03,
          color: Math.random() > 0.4 ? "#fff" : s.color,
          size: 0.8 + Math.random(),
          glitter: true,
          gravity: 0.02,
        });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // rocket trails + heads
    for (const r of rockets) {
      for (let i = 0; i < r.trail.length; i++) {
        const t = r.trail[i];
        ctx.globalAlpha = Math.max(0, t.life) * 0.6;
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.shadowBlur = 12;
      ctx.shadowColor = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // particles
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      if (p.glitter) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // fountain base glow
    for (const f of fountains) {
      const a = 1 - f.age / f.life;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 28);
      g.addColorStop(0, `rgba(255,200,80,${0.5 * a})`);
      g.addColorStop(1, "rgba(255,100,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(ts) {
    if (!running) return;
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.05) dt = 0.05; // clamp

    if (!reduced) {
      autoTimer += dt;
      if (autoTimer > 1.6 + Math.random() * 0.9) {
        autoTimer = 0;
        spawnAuto();
        if (Math.random() > 0.6) setTimeout(spawnAuto, 350);
      }
      update(dt);
    }
    draw();
    requestAnimationFrame(frame);
  }

  function pointerBurst(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    // don't steal Enter button clicks — handled by stopPropagation on UI
    if (reduced) {
      explode(x, y, randColor(), "burst");
      return;
    }
    const r = Math.random();
    if (y > H * 0.75) {
      startFountain(x);
    } else if (r < 0.7) {
      // rocket that bursts near click
      rockets.push({
        x,
        y: H * 0.86,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -4.5 - Math.random(),
        targetY: Math.max(60, y),
        color: randColor(),
        trail: [],
        kind: Math.random() > 0.4 ? "burst" : "ring",
      });
    } else {
      explode(x, y, randColor(), Math.random() > 0.5 ? "burst" : "ring");
      startSparkler(x, y);
    }
  }

  // UI wiring
  const soundBtn = document.getElementById("sound-toggle");
  if (soundBtn) {
    soundBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      soundOn = !soundOn;
      soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
      soundBtn.textContent = soundOn ? "🔊 Sound on" : "🔇 Sound off";
      if (soundOn) {
        try {
          if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          if (audioCtx.state === "suspended") audioCtx.resume();
          playPop(0.06);
        } catch (_) {}
      }
    });
  }

  const stage = document.getElementById("stage") || canvas;
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest && (e.target.closest(".enter-btn") || e.target.closest(".sound-toggle") || e.target.closest(".skip-landing"))) return;
    // Ignore presses on the Enter button area specifically
    const btn = document.getElementById("enter-btn");
    if (btn) {
      const r = btn.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return;
    }
    pointerBurst(e.clientX, e.clientY);
  });

  window.addEventListener("resize", () => {
    stars = [];
    resize();
  });

  resize();
  if (reduced) {
    // static pretty sky + a few gentle sparkles once
    for (let i = 0; i < 3; i++) {
      explode(W * (0.25 + i * 0.25), H * 0.35, randColor(), "burst");
    }
    document.documentElement.classList.add("reduced-motion");
  } else {
    // opening salvo
    setTimeout(() => launchRocket(W * 0.3), 400);
    setTimeout(() => launchRocket(W * 0.55), 900);
    setTimeout(() => startFountain(W * 0.45), 1200);
    setTimeout(() => launchRocket(W * 0.7), 1600);
  }
  requestAnimationFrame(frame);

  // expose for tests
  window.__diwaliFx = { launchRocket, explode, startFountain };
})();
