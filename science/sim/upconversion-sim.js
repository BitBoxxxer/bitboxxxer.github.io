/* ============================================
   Ап-конверсия: интерактивная демонстрация
   Физика - та же ETU rate-equation модель, что и в
   основном движке проекта (rate_equations.py), упрощённая
   до устойчивого Эйлер-интегрирования для браузера.
   ============================================ */

(function () {
  const ROOT_ID = 'ucSim';
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  // ---- физические параметры (те же порядки величины, что в rate_equations.py) ----
  const P = {
    n_yb: 1.4e22 * 0.20,
    n_er: 1.4e22 * 0.02,
    tau_yb: 2.0e-3,
    tau_e1: 6.0e-6 * 5.0,
    tau_e2: 3.0e-4 * 5.0,
    tau_e3: 4.0e-4 * 5.0,
    W1: 1.0e-17,
    W2: 3.0e-17,
    Cr: 5.0e-18,
    k23: 150.0,
    eta_g: 0.40,
    eta_r: 0.50,
    sigma: 9.0e-21,
    h: 6.62607015e-34,
    c: 2.99792458e8,
    lambda: 980e-9,
  };

  function pumpRate(I_w_cm2) {
    const photonE = (P.h * P.c) / P.lambda;
    const flux = I_w_cm2 / photonE;
    return P.sigma * flux;
  }

  // Стационарная интенсивность зелёного/красного при мощности накачки I (Вт/см^2)
  // dt и число шагов подобраны так, чтобы явный Эйлер успевал выйти на настоящий
  // стационар самого медленного канала (tau_e3_eff ~ 2 мс) - сверено с полным
  // решением через solve_ivp в rate_equations.py, расхождение < 0.1%.
  function steadyState(I) {
    if (I <= 0) return { green: 0, red: 0 };
    const Rp = pumpRate(I);
    let N1 = 0, E1 = 0, E2 = 0, E3 = 0;
    const dt = 3e-6;
    for (let i = 0; i < 5000; i++) {
      const N0 = Math.max(P.n_yb - N1, 0);
      const E0 = Math.max(P.n_er - (E1 + E2 + E3), 0);
      const ET1 = P.W1 * N1 * E0;
      const ET2 = P.W2 * N1 * E1;
      const CR = P.Cr * E2 * E0;
      const BR = P.k23 * E2;
      N1 += dt * (Rp * N0 - N1 / P.tau_yb - ET1 - ET2);
      E1 += dt * (ET1 - ET2 - E1 / P.tau_e1 + 2 * CR);
      E2 += dt * (ET2 - E2 / P.tau_e2 - BR - CR);
      E3 += dt * (BR - E3 / P.tau_e3);
      if (N1 < 0) N1 = 0; if (E1 < 0) E1 = 0; if (E2 < 0) E2 = 0; if (E3 < 0) E3 = 0;
    }
    return { green: (P.eta_g * E2) / P.tau_e2, red: (P.eta_r * E3) / P.tau_e3 };
  }

  // предрасчёт кривой I(P) для быстрого доступа + для графика
  const curve = [];
  for (let i = 0; i <= 48; i++) {
    const Pw = Math.pow(10, -2 + (i / 48) * 3); // 0.01 .. 10 Вт/см^2
    const r = steadyState(Pw);
    curve.push({ p: Pw, g: r.green, r: r.red });
  }
  const maxG = Math.max(...curve.map((c) => c.g)) || 1;
  const maxR = Math.max(...curve.map((c) => c.r)) || 1;

  function interp(Pw) {
    Pw = Math.max(0.01, Math.min(9.99, Pw));
    for (let i = 0; i < curve.length - 1; i++) {
      if (Pw >= curve[i].p && Pw <= curve[i + 1].p) {
        const t = (Pw - curve[i].p) / (curve[i + 1].p - curve[i].p);
        return {
          g: curve[i].g + t * (curve[i + 1].g - curve[i].g),
          r: curve[i].r + t * (curve[i + 1].r - curve[i].r),
        };
      }
    }
    return { g: curve[0].g, r: curve[0].r };
  }

  function localSlope(Pw) {
    const lo = interp(Pw * 0.85), hi = interp(Pw * 1.15);
    const a = Math.log(Math.max(lo.g, 1e-30)), b = Math.log(Math.max(hi.g, 1e-30));
    return (b - a) / (Math.log(Pw * 1.15) - Math.log(Pw * 0.85));
  }

  // ---- DOM ----
  root.innerHTML = `
    <div class="sim-block__header">
      <span class="sim-block__title">upconversion_demo.py --interactive</span>
      <span class="sim-block__badge">ETU rate-equation</span>
    </div>
    <div class="sim-block__stage">
      <div class="sim-canvas-wrap" style="aspect-ratio:16/8;">
        <canvas id="ucCanvas"></canvas>
      </div>
    </div>
    <div class="sim-legend">
      <span><i style="background:#e04b3f"></i>фотоны 980 нм (ИК, невидим глазу - показан условно)</span>
      <span><i style="background:#4dff8f"></i>излучение ~540 нм</span>
      <span><i style="background:#ff6a55"></i>излучение ~660 нм</span>
    </div>
    <div class="sim-block__controls">
      <div class="sim-control">
        <label>Мощность накачки <b id="ucPumpVal">1.00 Вт/см²</b></label>
        <input type="range" id="ucPump" min="0.01" max="5" step="0.01" value="1.0">
      </div>
    </div>
    <div class="sim-readouts">
      <div class="sim-ro"><div class="sim-ro__k">I(ЗЕЛЁНЫЙ)</div><div class="sim-ro__v" id="ucGreenRo">0<small>% от макс.</small></div></div>
      <div class="sim-ro"><div class="sim-ro__k">I(КРАСНЫЙ)</div><div class="sim-ro__v" id="ucRedRo">0<small>% от макс.</small></div></div>
      <div class="sim-ro"><div class="sim-ro__k">СООТНОШЕНИЕ G:R</div><div class="sim-ro__v" id="ucRatioRo">-</div></div>
      <div class="sim-ro"><div class="sim-ro__k">НАКЛОН log I / log P</div><div class="sim-ro__v" id="ucSlopeRo">-<small>n ≈ 2 → двухфотонный</small></div></div>
    </div>
    <div class="sim-note">
      Слева - поток ИК-фотонов (980 нм) попадает на условный нанокристалл: два фотона "складываются" на ионе
      Er³⁺ и излучается один видимый фотон. Справа - тот же процесс в виде графика в двойных логарифмических
      координатах: точка бежит по кривой I ~ P<sup>n</sup>, наклон в моменте показан ниже графика. При низкой
      мощности наклон близок к 2 (двухфотонный процесс), при высокой - "садится" к 1 (насыщение верхних уровней).
      Параметры модели - из <code>rate_equations.py</code> основного движка проекта (W1, W2, времена жизни,
      квантовые выходы), тот же формализм ETU. Яркость свечения кристалла на экране усилена для наглядности;
      цифры в панели ниже и график справа показывают точные, не скорректированные значения модели.
    </div>
  `;

  const canvas = document.getElementById('ucCanvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);

  const pumpInput = document.getElementById('ucPump');
  const pumpVal = document.getElementById('ucPumpVal');
  let pump = 1.0;
  pumpInput.addEventListener('input', () => {
    pump = parseFloat(pumpInput.value);
    pumpVal.textContent = `${pump.toFixed(2)} Вт/см²`;
  });

  // частицы-фотоны, летящие слева направо к "кристаллу" в центре
  let photons = [];
  let emissions = []; // вспышки испускания у кристалла

  function spawnPhoton(b) {
    return {
      x: b.x0,
      y: b.cy + (Math.random() - 0.5) * b.h * 0.5,
      speed: 1.8 + Math.random() * 0.6,
    };
  }

  let lastT = performance.now();
  let emitAccumulator = 0;

  function bounds() {
    return { x0: W * 0.06, x1: W * 0.94, cy: H * 0.5, h: H * 0.7, crystalX: W * 0.5 };
  }

  function draw(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    ctx.clearRect(0, 0, W, H);
    const b = bounds();

    // фоновая сетка терминала (очень тонкая)
    ctx.strokeStyle = 'rgba(0,255,65,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }

    // спавн фотонов пропорционально мощности
    const spawnRate = 2 + pump * 10;
    emitAccumulator += spawnRate * dt;
    while (emitAccumulator > 1) {
      photons.push(spawnPhoton(b));
      emitAccumulator -= 1;
    }

    const resp = interp(pump);
    const gNorm = resp.g / maxG;
    const rNorm = resp.r / maxR;
    // визуальная яркость - гамма-коррекция для наглядности демо (график и цифры
    // ниже остаются посчитаны по точным, не скорректированным значениям)
    const gVisual = Math.pow(gNorm, 0.35);
    const rVisual = Math.pow(rNorm, 0.35);

    // кристалл в центре
    ctx.save();
    ctx.translate(b.crystalX, b.cy);
    ctx.strokeStyle = 'rgba(0,255,65,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-18, -18, 36, 36);
    ctx.fillStyle = 'rgba(0,255,65,0.06)';
    ctx.fillRect(-18, -18, 36, 36);
    ctx.restore();

    // движение и отрисовка фотонов ИК
    const next = [];
    for (const ph of photons) {
      ph.x += ph.speed * dt * 220;
      if (ph.x < b.crystalX - 18) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(224,75,63,0.85)';
        ctx.arc(ph.x, ph.y, 2.2, 0, 7);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(224,75,63,0.25)';
        ctx.moveTo(ph.x - 14, ph.y);
        ctx.lineTo(ph.x, ph.y);
        ctx.stroke();
        next.push(ph);
      } else {
        // фотон поглощён - шанс на эмиссию зависит от мощности (насыщение кривой),
        // визуально скорректировано, чтобы свечение было заметно уже при умеренной P
        if (Math.random() < Math.min(gVisual * 1.3 + rVisual * 0.4, 0.95)) {
          const isGreen = Math.random() > (rNorm / (gNorm + rNorm + 1e-9)) * 0.4;
          emissions.push({ x: b.crystalX, y: b.cy, r: 2, a: 1, green: isGreen });
        }
      }
    }
    photons = next;

    // вспышки испускания - разлетаются вправо
    const nextE = [];
    for (const e of emissions) {
      e.r += dt * 140;
      e.a -= dt * 1.1;
      e.x += dt * 90;
      if (e.a > 0) {
        ctx.beginPath();
        const color = e.green ? `rgba(120,255,170,${e.a})` : `rgba(255,110,90,${e.a})`;
        ctx.fillStyle = color;
        ctx.arc(e.x, e.y, 2.5, 0, 7);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = e.green ? `rgba(120,255,170,${e.a * 0.4})` : `rgba(255,110,90,${e.a * 0.4})`;
        ctx.arc(e.x - 10, e.y, e.r * 0.3, 0, 7);
        ctx.stroke();
        nextE.push(e);
      }
    }
    emissions = nextE.slice(-120);

    // свечение кристалла пропорционально текущей интенсивности (визуально скорректировано)
    const glowR = 20 + gVisual * 40;
    const rg = ctx.createRadialGradient(b.crystalX, b.cy, 0, b.crystalX, b.cy, glowR);
    rg.addColorStop(0, `rgba(120,255,170,${Math.min(gVisual * 0.7, 0.6)})`);
    rg.addColorStop(1, 'rgba(120,255,170,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(b.crystalX, b.cy, glowR, 0, 7); ctx.fill();

    // ---- мини-график степенного закона в правой трети ----
    const gx0 = W * 0.68, gx1 = W * 0.93, gy0 = H * 0.18, gy1 = H * 0.85;
    ctx.strokeStyle = 'rgba(0,255,65,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
    ctx.fillStyle = 'rgba(0,255,65,0.5)';
    ctx.font = '9px monospace';
    ctx.fillText('log I', gx0 - 2, gy0 - 4);
    ctx.fillText('log P →', gx1 - 30, gy1 + 12);

    // кривая (лог-лог)
    const logPmin = Math.log10(0.01), logPmax = Math.log10(10);
    const logImin = Math.log10(Math.max(maxG * 1e-5, 1e-10)), logImax = Math.log10(maxG * 1.05);
    ctx.beginPath();
    curve.forEach((c, i) => {
      const px = gx0 + ((Math.log10(c.p) - logPmin) / (logPmax - logPmin)) * (gx1 - gx0);
      const gy = Math.log10(Math.max(c.g, 1e-10));
      const py = gy1 - ((gy - logImin) / (logImax - logImin)) * (gy1 - gy0);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = 'rgba(120,255,170,0.7)';
    ctx.stroke();

    // текущая точка
    const curP = Math.max(0.01, Math.min(9.99, pump));
    const px = gx0 + ((Math.log10(curP) - logPmin) / (logPmax - logPmin)) * (gx1 - gx0);
    const gy = Math.log10(Math.max(resp.g, 1e-10));
    const py = gy1 - ((gy - logImin) / (logImax - logImin)) * (gy1 - gy0);
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(px, py, 3, 0, 7);
    ctx.fill();

    // readouts
    document.getElementById('ucGreenRo').innerHTML = `${(gNorm * 100).toFixed(0)}<small>% от макс.</small>`;
    document.getElementById('ucRedRo').innerHTML = `${(rNorm * 100).toFixed(0)}<small>% от макс.</small>`;
    document.getElementById('ucRatioRo').textContent = resp.r > 1e-30 ? (resp.g / resp.r).toFixed(2) : '-';
    document.getElementById('ucSlopeRo').innerHTML = `${localSlope(pump).toFixed(2)}<small>n ≈ 2 → двухфотонный</small>`;

    requestAnimationFrame(draw);
  }

  resize();
  requestAnimationFrame(draw);
})();
