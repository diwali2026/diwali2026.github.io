/* Canvas demos for crackers.html. One demo runs at a time (~6 s).
 * Sound follows the landing-page preference (localStorage "diwali2026-sound").
 * prefers-reduced-motion: draws a single still frame instead of animating. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctxA = null, active = null;
  function soundOn() { try { return localStorage.getItem("diwali2026-sound") !== "off"; } catch (e) { return true; } }
  function audio() {
    if (!soundOn()) return null;
    try {
      if (!ctxA) ctxA = new (window.AudioContext || window.webkitAudioContext)();
      if (ctxA.state === "suspended") ctxA.resume();
      return ctxA;
    } catch (e) { return null; }
  }
  function pop(vol, freq, dur) {
    var a = audio(); if (!a || a.state !== "running") return;
    try {
      var t = a.currentTime, o = a.createOscillator(), g = a.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(freq || (380 + Math.random() * 300), t);
      o.frequency.exponentialRampToValueAtTime(70, t + (dur || 0.18));
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.05, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.18) + 0.04);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + (dur || 0.18) + 0.06);
    } catch (e) {}
  }
  function hiss(vol, dur) {
    var a = audio(); if (!a || a.state !== "running") return;
    try {
      var len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      f.type = "highpass"; f.frequency.value = 3000; g.gain.value = vol || 0.015;
      s.buffer = buf; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
    } catch (e) {}
  }
  var COLORS = ["#ff6b6b", "#ffd93d", "#6bcbff", "#ff9ff3", "#7bed9f", "#ffa502", "#a29bfe", "#55efc4"];
  function rc() { return COLORS[(Math.random() * COLORS.length) | 0]; }
  function R(a, b) { return a + Math.random() * (b - a); }

  function burst(ps, x, y, n, col, spd) {
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n + R(-0.05, 0.05), s = R(0.6, 1) * (spd || 2.2);
      ps.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R(50, 80), max: 80, c: col || rc(), g: 0.025, r: 2 });
    }
  }
  function stepParticles(c, ps, drag) {
    for (var i = ps.length - 1; i >= 0; i--) {
      var p = ps[i];
      p.vx *= drag || 0.985; p.vy = p.vy * (drag || 0.985) + (p.g || 0);
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) { ps.splice(i, 1); continue; }
      c.globalAlpha = Math.max(0, p.life / p.max);
      c.fillStyle = p.c;
      c.beginPath(); c.arc(p.x, p.y, p.r || 2, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }
  function ground(c, W, H) {
    c.fillStyle = "#2a1620"; c.fillRect(0, H - 14, W, 14);
  }

  var DEMOS = {
    sparkler: function (c, W, H, t, s) {
      var x = W * 0.5, y = H * 0.42, burn = Math.min(1, t / 360);
      var tipY = y + 70 * burn;
      c.strokeStyle = "#777"; c.lineWidth = 3; c.beginPath(); c.moveTo(x, tipY); c.lineTo(x, H - 10); c.stroke();
      c.strokeStyle = "#5a4a40"; c.beginPath(); c.moveTo(x, y + 70); c.lineTo(x, H - 10); c.stroke();
      for (var i = 0; i < 6; i++) {
        var a = R(0, Math.PI * 2), sp = R(1, 3.4);
        s.ps.push({ x: x, y: tipY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: R(10, 24), max: 24, c: Math.random() < 0.7 ? "#fff3c4" : "#ffd36b", r: 1.4, g: 0.04 });
      }
      c.fillStyle = "rgba(255,240,190,0.9)"; c.beginPath(); c.arc(x, tipY, 4, 0, 7); c.fill();
      if (t % 30 === 0) hiss(0.01, 0.4);
      stepParticles(c, s.ps, 0.93);
    },
    anar: function (c, W, H, t, s) {
      ground(c, W, H);
      var x = W * 0.5, y = H - 14;
      c.fillStyle = "#c0612b"; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 14, y); c.lineTo(x + 5, y - 22); c.lineTo(x - 5, y - 22); c.closePath(); c.fill();
      var k = t < 300 ? 9 : 2;
      for (var i = 0; i < k; i++) {
        s.ps.push({ x: x + R(-2, 2), y: y - 22, vx: R(-1.1, 1.1), vy: R(-5.2, -3.2), life: R(40, 70), max: 70, c: Math.random() < 0.5 ? "#fff1b8" : (Math.random() < 0.5 ? "#ffb347" : "#ffd93d"), r: 1.6, g: 0.07 });
      }
      if (t % 25 === 0) hiss(0.014, 0.5);
      stepParticles(c, s.ps, 0.995);
    },
    chakri: function (c, W, H, t, s) {
      ground(c, W, H);
      var x = W * 0.5 + Math.sin(t / 50) * 30, y = H - 26, ang = t * 0.35;
      c.save(); c.translate(x, y); c.rotate(ang);
      c.strokeStyle = "#e0b04a"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.stroke(); c.restore();
      for (var i = 0; i < 6; i++) {
        var a = ang + i * 0.06, px = x + Math.cos(a) * 11, py = y + Math.sin(a) * 11;
        s.ps.push({ x: px, y: py, vx: Math.cos(a + 1.57) * R(2, 4), vy: Math.sin(a + 1.57) * R(2, 4), life: R(14, 26), max: 26, c: t % 120 < 60 ? "#7bed9f" : "#ffd93d", r: 1.6, g: 0.03 });
      }
      if (t % 18 === 0) hiss(0.012, 0.3);
      stepParticles(c, s.ps, 0.95);
    },
    rocket: function (c, W, H, t, s) {
      ground(c, W, H);
      if (!s.r) s.r = { x: W * 0.5, y: H - 16, vy: -4.6, done: false, n: 0 };
      var r = s.r;
      if (!r.done) {
        r.y += r.vy; r.vy += 0.03;
        s.ps.push({ x: r.x + R(-1, 1), y: r.y + 6, vx: R(-0.4, 0.4), vy: R(0.5, 1.5), life: 24, max: 24, c: "#ffcf7a", r: 1.5 });
        c.fillStyle = "#fff"; c.fillRect(r.x - 1.5, r.y - 6, 3, 10);
        if (r.vy > -0.6 || r.y < H * 0.25) { r.done = true; burst(s.ps, r.x, r.y, 70, rc(), 2.6); pop(0.08, 300, 0.3); }
        if (t === 1) hiss(0.02, 1);
      } else if (t > 200 && r.n < 1) { s.r = { x: W * R(0.3, 0.7), y: H - 16, vy: -4.8, done: false, n: 1 }; hiss(0.02, 1); }
      stepParticles(c, s.ps);
    },
    bomb: function (c, W, H, t, s) {
      ground(c, W, H);
      var x = W * 0.5, y = H - 24;
      if (t < 120) {
        c.fillStyle = "#b5432f"; c.fillRect(x - 10, y - 8, 20, 18);
        var fx = x + 10 + (120 - t) * 0.25, fy = y - 8 - (120 - t) * 0.12;
        c.strokeStyle = "#ccc"; c.beginPath(); c.moveTo(x + 8, y - 6); c.lineTo(fx, fy); c.stroke();
        for (var i = 0; i < 2; i++) s.ps.push({ x: fx, y: fy, vx: R(-1, 1), vy: R(-1.5, 0), life: 12, max: 12, c: "#ffd36b", r: 1.2 });
        c.fillStyle = "#fff"; c.font = "12px sans-serif"; c.textAlign = "center"; c.fillText("Stand far back…", x, 22);
      } else if (t < 220) {
        if (t === 120) { pop(0.12, 160, 0.4); burst(s.ps, x, y, 40, "#ffe08a", 3.2); }
        var k = (t - 120) / 100;
        c.strokeStyle = "rgba(255,230,160," + (1 - k) + ")"; c.lineWidth = 3;
        c.beginPath(); c.arc(x, y, 10 + k * 120, 0, 7); c.stroke();
        c.fillStyle = "rgba(255,250,220," + Math.max(0, 0.6 - k * 2) + ")"; c.fillRect(0, 0, W, H);
        c.fillStyle = "rgba(160,150,150," + (0.35 * (1 - k)) + ")"; c.beginPath(); c.arc(x, y - 20 * k, 30 + 40 * k, 0, 7); c.fill();
      } else { s.reset = true; }
      stepParticles(c, s.ps);
    },
    chain: function (c, W, H, t, s) {
      var n = 22, x0 = W * 0.12, x1 = W * 0.88, y = H * 0.55;
      if (s.i == null) s.i = 0;
      c.strokeStyle = "#a33"; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
      for (var k = s.i; k < n; k++) { var px = x0 + (x1 - x0) * k / (n - 1); c.fillStyle = "#d9452f"; c.fillRect(px - 3, y - 7, 6, 14); }
      if (t % 9 === 0 && s.i < n) {
        var bx = x0 + (x1 - x0) * s.i / (n - 1);
        burst(s.ps, bx, y, 14, "#ffe9a8", 1.8); pop(0.05, R(500, 800), 0.08); s.i++;
      }
      if (s.i >= n && t % 9 === 0 && s.ps.length === 0) s.i = 0;
      stepParticles(c, s.ps, 0.93);
    },
    pencil: function (c, W, H, t, s) {
      var x = W * 0.5, y = H * 0.35, col = ["#ff6b6b", "#7bed9f", "#6bcbff", "#ffd93d"][((t / 90) | 0) % 4];
      c.fillStyle = "#e9c46a"; c.fillRect(x - 3, y, 6, 80);
      c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 25; c.beginPath(); c.arc(x, y, 7 + Math.sin(t / 3) * 1.5, 0, 7); c.fill(); c.shadowBlur = 0;
      for (var i = 0; i < 2; i++) s.ps.push({ x: x, y: y, vx: R(-0.8, 0.8), vy: R(-1.5, 0.2), life: 20, max: 20, c: col, r: 1.3, g: 0.03 });
      stepParticles(c, s.ps, 0.96);
    },
    snake: function (c, W, H, t, s) {
      ground(c, W, H);
      var x = W * 0.5, y = H - 18, len = Math.min(t, 360) / 360;
      c.fillStyle = "#222"; c.beginPath(); c.ellipse(x, y, 10, 4, 0, 0, 7); c.fill();
      c.strokeStyle = "#3a3330"; c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y);
      var steps = Math.floor(len * 120);
      for (var i = 0; i < steps; i++) { var u = i / 120; c.lineTo(x + Math.sin(u * 12) * 18 * u + u * 40, y - u * (H * 0.6)); }
      c.stroke(); c.strokeStyle = "#5a504a"; c.lineWidth = 3; c.stroke();
      if (steps > 0) { c.fillStyle = "rgba(255,140,60,0.8)"; c.beginPath(); c.arc(x, y - 2, 4, 0, 7); c.fill(); }
      if (t < 360 && t % 4 === 0) s.ps.push({ x: x, y: y - 5, vx: R(-0.3, 0.3), vy: R(-0.8, -0.4), life: 70, max: 70, c: "rgba(190,190,190,0.6)", r: 6 });
      stepParticles(c, s.ps, 1);
    },
    caps: function (c, W, H, t, s) {
      var x = W * 0.42, y = H * 0.55;
      c.fillStyle = "#666"; c.fillRect(x - 40, y - 8, 70, 16); c.fillRect(x - 40, y + 4, 16, 34);
      c.fillStyle = "#c33"; c.fillRect(x + 30, y - 4, 10, 8);
      if (t % 45 === 0) { burst(s.ps, x + 44, y, 10, "#fff2c0", 1.4); for (var i = 0; i < 6; i++) s.ps.push({ x: x + 44, y: y, vx: R(0.2, 0.8), vy: R(-0.6, -0.2), life: 60, max: 60, c: "rgba(200,200,200,0.5)", r: 5 }); pop(0.04, 900, 0.05); }
      stepParticles(c, s.ps, 0.97);
    },
    aerial: function (c, W, H, t, s) {
      ground(c, W, H);
      if (t % 70 === 1 && t < 420) { s.shots = s.shots || []; s.shots.push({ x: W * R(0.3, 0.7), y: H - 16, vy: -5 }); pop(0.03, 200, 0.1); }
      (s.shots || []).forEach(function (sh) {
        if (sh.dead) return;
        sh.y += sh.vy; sh.vy += 0.04;
        c.fillStyle = "#ffe7a0"; c.beginPath(); c.arc(sh.x, sh.y, 2, 0, 7); c.fill();
        if (sh.vy > -1) { sh.dead = true; burst(s.ps, sh.x, sh.y, 55, rc(), 2.4); pop(0.07, 260, 0.3); }
      });
      stepParticles(c, s.ps);
    },
    cake: function (c, W, H, t, s) {
      ground(c, W, H);
      c.fillStyle = "#8b2332"; c.fillRect(W * 0.5 - 22, H - 34, 44, 20);
      if (t % 22 === 1 && t < 440) {
        var dir = ((t / 22) | 0) % 2 ? 1 : -1;
        s.shots = s.shots || []; s.shots.push({ x: W * 0.5, y: H - 34, vx: dir * R(0.6, 1.4), vy: -4.4 });
        pop(0.03, 220, 0.08);
      }
      (s.shots || []).forEach(function (sh) {
        if (sh.dead) return;
        sh.x += sh.vx; sh.y += sh.vy; sh.vy += 0.05;
        c.fillStyle = "#ffd9a0"; c.beginPath(); c.arc(sh.x, sh.y, 2, 0, 7); c.fill();
        if (sh.vy > -0.8) { sh.dead = true; burst(s.ps, sh.x, sh.y, 30, rc(), 1.8); pop(0.05, 340, 0.2); }
      });
      stepParticles(c, s.ps);
    },
    smoke: function (c, W, H, t, s) {
      ground(c, W, H);
      var cols = ["rgba(255,120,150,0.35)", "rgba(120,200,255,0.35)", "rgba(255,210,90,0.35)"];
      cols.forEach(function (col, i) {
        var x = W * (0.3 + i * 0.2);
        if (t < 380 && t % 3 === 0) s.ps.push({ x: x, y: H - 18, vx: R(-0.4, 0.4), vy: R(-1.1, -0.6), life: 140, max: 140, c: col, r: R(8, 14), grow: 0.25 });
        c.fillStyle = "#555"; c.fillRect(x - 4, H - 26, 8, 12);
      });
      s.ps.forEach(function (p) { p.r += p.grow || 0; });
      stepParticles(c, s.ps, 1);
    },
    led: function (c, W, H, t, s) {
      var x = W * 0.5, y = H * 0.55, hue = (t * 2) % 360;
      c.save(); c.translate(x, y); c.rotate(Math.sin(t / 30) * 0.6);
      c.fillStyle = "#333"; c.fillRect(-4, 10, 8, 40);
      c.shadowColor = "hsl(" + hue + ",90%,60%)"; c.shadowBlur = 30;
      c.fillStyle = "hsl(" + hue + ",90%,70%)"; c.fillRect(-3, -60, 6, 70);
      c.restore(); c.shadowBlur = 0;
      c.fillStyle = "#cfe"; c.font = "12px sans-serif"; c.textAlign = "center"; c.fillText("No flame · no smoke · reusable", x, 22);
    },
    drone: function (c, W, H, t, s) {
      var n = 60;
      if (!s.d) { s.d = []; for (var i = 0; i < n; i++) s.d.push({ x: R(0, W), y: H - 10, tx: 0, ty: 0 }); }
      var phase = ((t / 160) | 0) % 3, cx = W / 2, cy = H * 0.45, sc = Math.min(W, H) * 0.32;
      s.d.forEach(function (d, i) {
        var u = i / n, tx, ty;
        if (phase === 0) { tx = cx + Math.cos(u * 6.283) * sc; ty = cy + Math.sin(u * 6.283) * sc * 0.6; }
        else if (phase === 1) {
          if (i < 40) { var a = Math.PI * (u * 1.5); tx = cx + Math.cos(a) * sc * (i < 40 ? 1 : 0) * (u < 0.33 ? 1 : 1); ty = cy + 10 + Math.abs(Math.sin(a)) * sc * 0.35; tx = cx + (u / 0.667 - 0.5) * sc * 2; ty = cy + 10 + Math.sin((u / 0.667) * Math.PI) * sc * 0.4; }
          else { var v = (i - 40) / 20; tx = cx + Math.sin(v * 6.283) * sc * 0.12 * (1 - v); ty = cy - v * sc * 0.6; }
        } else { tx = cx + (u - 0.5) * sc * 2.6; ty = cy + Math.sin(u * 12 + t / 10) * 20; }
        d.x += (tx - d.x) * 0.05; d.y += (ty - d.y) * 0.05;
        var col = phase === 1 ? (i < 40 ? "#e9a35a" : "#ffd93d") : "hsl(" + ((u * 360 + t) % 360) + ",90%,65%)";
        c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 8;
        c.beginPath(); c.arc(d.x, d.y, 2.4, 0, 7); c.fill();
      });
      c.shadowBlur = 0;
    },
    laser: function (c, W, H, t, s) {
      var ox = W * 0.5, oy = H - 10;
      c.globalCompositeOperation = "lighter";
      for (var i = 0; i < 6; i++) {
        var a = -Math.PI / 2 + Math.sin(t / 40 + i) * 0.9, col = ["#ff3b6b", "#3bff9a", "#3bb6ff"][i % 3];
        c.strokeStyle = col; c.globalAlpha = 0.6; c.lineWidth = 2;
        c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a) * H * 1.4, oy + Math.sin(a) * H * 1.4); c.stroke();
      }
      c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    }
  };

  function stop() {
    if (!active) return;
    cancelAnimationFrame(active.raf);
    active.btn.textContent = "▶ Play demo";
    active.btn.setAttribute("aria-pressed", "false");
    active = null;
  }

  function play(card) {
    var btn = card.querySelector("[data-demo-btn]"), cv = card.querySelector("canvas.demo-canvas");
    if (active && active.btn === btn) { stop(); return; }
    stop();
    var type = card.getAttribute("data-demo");
    var fn = DEMOS[type]; if (!fn || !cv) return;
    audio(); // unlock on this click (user gesture)
    cv.hidden = false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = cv.clientWidth || 300, H = cv.clientHeight || 170;
    cv.width = W * dpr; cv.height = H * dpr;
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var state = { ps: [] }, t = 0;
    btn.textContent = "■ Stop"; btn.setAttribute("aria-pressed", "true");
    active = { btn: btn, raf: 0 };
    function frame() {
      t++;
      c.fillStyle = "rgba(14,8,28,0.35)"; c.fillRect(0, 0, W, H);
      fn(c, W, H, t, state);
      if (state.reset) { state = { ps: [] }; t = 0; }
      if (t > 480 && !reduce) { stop(); return; }
      active.raf = requestAnimationFrame(frame);
    }
    if (reduce) {
      // Still frame: simulate quietly to a representative moment, draw once.
      c.fillStyle = "#0e081c"; c.fillRect(0, 0, W, H);
      var a0 = ctxA; ctxA = null; var saved = soundOn; soundOn = function () { return false; };
      for (var i = 0; i < 140; i++) { t++; c.fillStyle = "rgba(14,8,28,0.35)"; c.fillRect(0, 0, W, H); fn(c, W, H, t, state); }
      soundOn = saved; ctxA = a0;
      c.fillStyle = "#fde9b8"; c.font = "11px sans-serif"; c.textAlign = "left"; c.fillText("Still preview (reduced motion)", 8, H - 20);
      btn.textContent = "▶ Play demo"; btn.setAttribute("aria-pressed", "false"); active = null;
      return;
    }
    c.fillStyle = "#0e081c"; c.fillRect(0, 0, W, H);
    active.raf = requestAnimationFrame(frame);
  }

  document.querySelectorAll("[data-demo]").forEach(function (card) {
    var btn = card.querySelector("[data-demo-btn]");
    if (btn) btn.addEventListener("click", function () { play(card); });
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); });
  window.__crackerDemos = { types: Object.keys(DEMOS), play: function (sel) { var el = document.querySelector(sel); if (el) play(el); }, stop: stop };
})();
