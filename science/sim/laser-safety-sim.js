/* ============================================
   ИК vs видимый лазер: моргательный рефлекс +
   затухание по закону Бера-Ламберта в ткани.
   ============================================ */

(function () {
  const root = document.getElementById('lsSim');
  if (!root) return;

  root.innerHTML = `
    <div class="sim-block__header">
      <span class="sim-block__title">beer_lambert_demo.py --interactive</span>
      <span class="sim-block__badge">I(z) = I0 · exp(-α·z)</span>
    </div>
    <div class="sim-block__stage">
      <div class="sim-canvas-wrap" style="aspect-ratio:16/9;">
        <canvas id="lsCanvas"></canvas>
      </div>
    </div>
    <div class="sim-legend">
      <span><i style="background:#4dff8f"></i>видимый лазер (532 нм) - глаз реагирует</span>
      <span><i style="background:#e04b3f"></i>ИК-лазер (980 нм) - глаз не видит и не реагирует</span>
      <span><i style="background:#5fb4c9"></i>ткань / вода (глубина проникновения)</span>
    </div>
    <div class="sim-block__controls">
      <div class="sim-control">
        <label>Длина волны источника <b id="lsWaveVal">980 нм (ИК)</b></label>
        <input type="range" id="lsWave" min="0" max="1" step="1" value="1">
      </div>
      <div class="sim-control">
        <label>Коэффициент поглощения ткани α <b id="lsAlphaVal">0.25 см⁻¹</b></label>
        <input type="range" id="lsAlpha" min="0.05" max="3" step="0.05" value="0.25">
      </div>
    </div>
    <div class="sim-readouts">
      <div class="sim-ro"><div class="sim-ro__k">МОРГАТЕЛЬНЫЙ РЕФЛЕКС</div><div class="sim-ro__v" id="lsBlinkRo">-</div></div>
      <div class="sim-ro"><div class="sim-ro__k">ГЛУБИНА 50% ЭНЕРГИИ</div><div class="sim-ro__v" id="lsDepthRo">-<small>см</small></div></div>
      <div class="sim-ro"><div class="sim-ro__k">ДОЗА НА СЕТЧАТКЕ</div><div class="sim-ro__v" id="lsDoseRo">-</div></div>
    </div>
    <div class="sim-note">
      Слева - луч входит в глаз: видимый (зелёная точка) вызывает мгновенное зажмуривание (аверсионный
      рефлекс) задолго до того, как накопится опасная доза. ИК-луч (980 нм) невидим - рефлекс не срабатывает,
      экспозиция продолжается. Справа - тот же луч, попавший в ткань/воду: график показывает убывание
      интенсивности I(z) = I0·exp(-α·z) с глубиной z, α подбирается ползунком. Чем меньше α - тем глубже
      проникает свет (это и есть "оптическое окно" ткани 700-950 нм из статьи).
    </div>
  `;

  const canvas = document.getElementById('lsCanvas');
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

  const waveInput = document.getElementById('lsWave');
  const waveVal = document.getElementById('lsWaveVal');
  const alphaInput = document.getElementById('lsAlpha');
  const alphaVal = document.getElementById('lsAlphaVal');

  let isIR = true;
  let alpha = 0.25;

  waveInput.addEventListener('input', () => {
    isIR = waveInput.value === '1';
    waveVal.textContent = isIR ? '980 нм (ИК)' : '532 нм (видимый)';
  });
  alphaInput.addEventListener('input', () => {
    alpha = parseFloat(alphaInput.value);
    alphaVal.textContent = `${alpha.toFixed(2)} см⁻¹`;
  });

  let t = 0;
  let blinkPhase = 0; // 0..1, анимация закрытия века для видимого света
  let exposedTime = 0; // накопленная "доза" для ИК (не прерывается морганием)
  let lastT = performance.now();

  function draw(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    t += dt;

    ctx.clearRect(0, 0, W, H);

    // === левая половина: глаз + луч ===
    const eyeCx = W * 0.20, eyeCy = H * 0.5, eyeR = Math.min(W, H) * 0.14;
    const beamColor = isIR ? 'rgba(224,75,63,0.9)' : 'rgba(120,255,170,0.9)';
    const beamGlow = isIR ? 'rgba(224,75,63,0.15)' : 'rgba(120,255,170,0.25)';

    // источник луча слева
    const srcX = W * 0.04, srcY = eyeCy;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,255,65,0.3)';
    ctx.rect(srcX - 6, srcY - 5, 10, 10);
    ctx.stroke();

    // моргательный рефлекс: для видимого света веко реагирует почти мгновенно и циклично
    if (!isIR) {
      // цикл: открыто 1.4с, закрытие 0.15с, закрыто 0.3с, открытие 0.15с
      const cycle = 1.9;
      const ph = t % cycle;
      if (ph < 1.4) blinkPhase = 0;
      else if (ph < 1.55) blinkPhase = (ph - 1.4) / 0.15;
      else if (ph < 1.85) blinkPhase = 1;
      else blinkPhase = 1 - (ph - 1.85) / 0.15;
      exposedTime = 0;
    } else {
      blinkPhase = 0; // веко не реагирует на ИК
      exposedTime += dt;
    }

    // луч от источника к глазу (обрезается веком, если оно закрыто)
    const beamBlocked = blinkPhase > 0.85;
    if (!beamBlocked) {
      ctx.beginPath();
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 2;
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(eyeCx - eyeR * 0.9, eyeCy);
      ctx.stroke();

      // свечение вдоль луча
      ctx.beginPath();
      ctx.strokeStyle = beamGlow;
      ctx.lineWidth = 10;
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(eyeCx - eyeR * 0.9, eyeCy);
      ctx.stroke();
    }

    // глаз (контур)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,255,65,0.6)';
    ctx.lineWidth = 1.5;
    ctx.ellipse(eyeCx, eyeCy, eyeR, eyeR * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();

    // зрачок
    if (!beamBlocked) {
      ctx.beginPath();
      ctx.fillStyle = isIR ? 'rgba(224,75,63,0.5)' : 'rgba(120,255,170,0.5)';
      ctx.arc(eyeCx, eyeCy, eyeR * 0.22, 0, 7);
      ctx.fill();
    }

    // веко - закрывается сверху и снизу пропорционально blinkPhase
    const lidH = eyeR * 0.62 * blinkPhase;
    ctx.fillStyle = '#000000';
    ctx.fillRect(eyeCx - eyeR - 4, eyeCy - eyeR * 0.62 - 2, (eyeR + 4) * 2, lidH);
    ctx.fillRect(eyeCx - eyeR - 4, eyeCy + eyeR * 0.62 * (1 - blinkPhase) + 2, (eyeR + 4) * 2, lidH);
    if (blinkPhase > 0.01) {
      ctx.strokeStyle = 'rgba(0,255,65,0.4)';
      ctx.beginPath();
      ctx.moveTo(eyeCx - eyeR, eyeCy - eyeR * 0.62 * (1 - blinkPhase));
      ctx.lineTo(eyeCx + eyeR, eyeCy - eyeR * 0.62 * (1 - blinkPhase));
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,255,65,0.6)';
    ctx.font = '10px monospace';
    ctx.fillText(isIR ? 'рефлекс: НЕ СРАБАТЫВАЕТ' : 'рефлекс: моргание < 0.3с', eyeCx - eyeR, eyeCy + eyeR * 0.9 + 14);

    // === правая половина: график Бера-Ламберта ===
    const gx0 = W * 0.52, gx1 = W * 0.94, gy0 = H * 0.14, gy1 = H * 0.82;
    ctx.strokeStyle = 'rgba(0,255,65,0.25)';
    ctx.strokeRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
    ctx.fillStyle = 'rgba(0,255,65,0.5)';
    ctx.font = '9px monospace';
    ctx.fillText('I(z)/I0', gx0 - 2, gy0 - 4);
    ctx.fillText('глубина z, см →', gx1 - 70, gy1 + 12);

    const zMax = 5; // см
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const z = (i / 100) * zMax;
      const val = Math.exp(-alpha * z);
      const px = gx0 + (i / 100) * (gx1 - gx0);
      const py = gy1 - val * (gy1 - gy0);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = isIR ? 'rgba(224,75,63,0.8)' : 'rgba(120,255,170,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // линия 50%
    const y50 = gy1 - 0.5 * (gy1 - gy0);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.setLineDash([3, 3]);
    ctx.moveTo(gx0, y50); ctx.lineTo(gx1, y50);
    ctx.stroke();
    ctx.setLineDash([]);

    const depth50 = Math.log(2) / alpha;

    // readouts
    document.getElementById('lsBlinkRo').textContent = isIR ? 'не работает (невидим)' : 'работает (< 0.3 с)';
    document.getElementById('lsDepthRo').innerHTML = `${depth50.toFixed(2)}<small>см</small>`;
    document.getElementById('lsDoseRo').textContent = isIR
      ? `растёт непрерывно (t=${exposedTime.toFixed(1)}с)`
      : 'прерывается морганием';

    requestAnimationFrame(draw);
  }

  resize();
  requestAnimationFrame(draw);
})();
