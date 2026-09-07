/* ============================================
   Закон Стокса: скорость оседания капель разного
   радиуса. v = (2/9) * (rho_p - rho_f) * g * r^2 / mu
   ============================================ */

(function () {
  const root = document.getElementById('stSim');
  if (!root) return;

  root.innerHTML = `
    <div class="sim-block__header">
      <span class="sim-block__title">stokes_settling.py --interactive</span>
      <span class="sim-block__badge">v ~ r²</span>
    </div>
    <div class="sim-block__stage">
      <div class="sim-canvas-wrap" style="aspect-ratio:16/9;">
        <canvas id="stCanvas"></canvas>
      </div>
    </div>
    <div class="sim-legend">
      <span><i style="background:#4dff8f"></i>крупная капля (~10 мкм) - оседает быстро</span>
      <span><i style="background:#5fb4c9"></i>средняя капля (~3 мкм)</span>
      <span><i style="background:#e0a02f"></i>мелкая капля (&lt;1 мкм) - почти не оседает</span>
    </div>
    <div class="sim-block__controls">
      <div class="sim-control">
        <label>Множитель времени <b id="stSpeedVal">1×</b></label>
        <input type="range" id="stSpeed" min="1" max="20" step="1" value="1">
      </div>
    </div>
    <div class="sim-readouts">
      <div class="sim-ro"><div class="sim-ro__k">v (10 мкм)</div><div class="sim-ro__v" id="stV1Ro">-<small>мм/с</small></div></div>
      <div class="sim-ro"><div class="sim-ro__k">v (3 мкм)</div><div class="sim-ro__v" id="stV2Ro">-<small>мм/с</small></div></div>
      <div class="sim-ro"><div class="sim-ro__k">v (1 мкм)</div><div class="sim-ro__v" id="stV3Ro">-<small>мм/с</small></div></div>
    </div>
    <div class="sim-note">
      Три капли одинаковой плотности (вода в воздухе) стартуют одновременно у потолка камеры. Их скорость
      оседания различается по формуле закона Стокса, где скорость пропорциональна <b>квадрату радиуса</b>:
      уменьшение капли в 3 раза замедляет её падение в 9 раз. Мелкая капля (жёлтая) в реальности ещё и
      "дрожит" от броуновского движения молекул воздуха, из-за чего может часами не долетать до пола - здесь
      это показано лёгким случайным дрожанием траектории. Множитель времени ускоряет ролик, не физику.
    </div>
  `;

  const canvas = document.getElementById('stCanvas');
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

  // --- физика: закон Стокса ---
  const G = 9.81;
  const rho_p = 1000.0; // кг/м^3, вода
  const rho_f = 1.2;    // кг/м^3, воздух
  const mu = 1.81e-5;   // Па*с, вязкость воздуха

  function stokesVelocity(r_m) {
    return (2 / 9) * (rho_p - rho_f) * G * r_m * r_m / mu; // м/с
  }

  const drops = [
    { label: '10 мкм', r_um: 10, color: 'rgba(120,255,170,0.9)', x: 0.30 },
    { label: '3 мкм', r_um: 3, color: 'rgba(95,180,201,0.9)', x: 0.52 },
    { label: '1 мкм', r_um: 1, color: 'rgba(224,160,47,0.9)', x: 0.74 },
  ];

  drops.forEach((d) => {
    d.v_m_s = stokesVelocity(d.r_um * 1e-6);
    d.y = 0.08; // нормированная позиция по высоте камеры (0=потолок,1=пол)
  });

  const speedInput = document.getElementById('stSpeed');
  const speedVal = document.getElementById('stSpeedVal');
  let speedMult = 1;
  speedInput.addEventListener('input', () => {
    speedMult = parseFloat(speedInput.value);
    speedVal.textContent = `${speedMult}×`;
  });

  // масштаб: сколько "метров камеры" помещается в нормированную высоту 0..1
  const CHAMBER_HEIGHT_M = 0.25; // 25 см - условная высота демонстрационного объёма

  let lastT = performance.now();

  function draw(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    ctx.clearRect(0, 0, W, H);

    const b = { x0: W * 0.08, x1: W * 0.92, y0: H * 0.10, y1: H * 0.88 };
    ctx.strokeStyle = 'rgba(0,255,65,0.25)';
    ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);

    // метки пол/потолок
    ctx.fillStyle = 'rgba(0,255,65,0.4)';
    ctx.font = '9px monospace';
    ctx.fillText('потолок камеры', b.x0 + 4, b.y0 - 4);
    ctx.fillText('пол', b.x0 + 4, b.y1 + 12);

    drops.forEach((d) => {
      const dyNorm = (d.v_m_s / CHAMBER_HEIGHT_M) * dt * speedMult;
      d.y = Math.min(d.y + dyNorm, 0.97);

      const px = b.x0 + d.x * (b.x1 - b.x0) + (Math.random() - 0.5) * (d.r_um < 2 ? 6 : 1);
      const py = b.y0 + d.y * (b.y1 - b.y0);

      // след
      ctx.beginPath();
      ctx.strokeStyle = d.color.replace('0.9', '0.15');
      ctx.lineWidth = 1;
      ctx.moveTo(px, b.y0 + 0.08 * (b.y1 - b.y0));
      ctx.lineTo(px, py);
      ctx.stroke();

      // капля
      const rPx = Math.max(2, Math.min(9, d.r_um * 0.7));
      ctx.beginPath();
      ctx.fillStyle = d.color;
      ctx.arc(px, py, rPx, 0, 7);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '9px monospace';
      ctx.fillText(d.label, px - 12, b.y0 - 16);

      // если долетела до пола - сбрасываем через паузу (эмулируем непрерывный цикл распыления)
      if (d.y >= 0.97) {
        d._settleTimer = (d._settleTimer || 0) + dt;
        if (d._settleTimer > 0.6) {
          d.y = 0.08;
          d._settleTimer = 0;
        }
      }
    });

    document.getElementById('stV1Ro').innerHTML = `${(drops[0].v_m_s * 1000).toFixed(2)}<small>мм/с</small>`;
    document.getElementById('stV2Ro').innerHTML = `${(drops[1].v_m_s * 1000).toFixed(3)}<small>мм/с</small>`;
    document.getElementById('stV3Ro').innerHTML = `${(drops[2].v_m_s * 1000).toFixed(4)}<small>мм/с</small>`;

    requestAnimationFrame(draw);
  }

  resize();
  requestAnimationFrame(draw);
})();
