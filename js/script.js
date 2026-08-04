/* =========================================================
   Aqua+ · Projeto Integrador — script.js
   Menu mobile · animações de entrada · contadores · OLED da
   home · simulador de temperatura · Disco de Newton ·
   calculadora Q = m·c·ΔT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menu mobile (hambúrguer) ---------- */
  const topbar = document.querySelector('.topbar');
  const toggle = document.querySelector('.nav-toggle');
  if (topbar && toggle) {
    toggle.addEventListener('click', () => {
      const aberto = topbar.classList.toggle('aberto');
      toggle.setAttribute('aria-expanded', String(aberto));
      toggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
    document.querySelectorAll('.menu a').forEach(link =>
      link.addEventListener('click', () => {
        topbar.classList.remove('aberto');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- Revelar elementos ao rolar ---------- */
  const reveals = [...document.querySelectorAll('.reveal')];
  if (movimentoReduzido || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('visivel'));
  } else {
    const io = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visivel'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  }

  /* ---------- Contadores animados (Home) ---------- */
  const nums = [...document.querySelectorAll('.num[data-count]')];
  if (nums.length) {
    const formatar = (v, d) =>
      v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
    const animar = el => {
      const alvo = parseFloat(el.dataset.count);
      const dec = Number(el.dataset.dec || 0);
      if (movimentoReduzido) { el.textContent = formatar(alvo, dec); return; }
      const dur = 1400, t0 = performance.now();
      const passo = t => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = formatar(alvo * eased, dec);
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    };
    if ('IntersectionObserver' in window) {
      const io2 = new IntersectionObserver(entradas => {
        entradas.forEach(e => {
          if (e.isIntersecting) { animar(e.target); io2.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      nums.forEach(n => io2.observe(n));
    } else nums.forEach(animar);
  }

  /* ---------- OLED "vivo" da Home ---------- */
  const oledHome = document.querySelector('[data-oled-temp]');
  if (oledHome && !movimentoReduzido) {
    let t = 27.4;
    setInterval(() => {
      t += (Math.random() - 0.48) * 0.2;
      t = Math.max(26.6, Math.min(29.4, t));
      oledHome.textContent = t.toFixed(1);
    }, 1600);
  }

  /* ---------- Simulador de temperatura (Programação) ---------- */
  const slider = document.getElementById('sim-temp');
  if (slider) {
    const ALVO = 30, BANDA = 0.5;
    let temp = parseFloat(slider.value);
    let ligado = false, aquecendo = false, timer = null;

    const saida    = document.getElementById('sim-out');
    const oledTemp = document.getElementById('sim-oled-temp');
    const status   = document.getElementById('sim-status');
    const sys      = document.getElementById('sim-sys');
    const ledRele  = document.getElementById('led-rele');
    const ledOk    = document.getElementById('led-ok');
    const pino     = document.getElementById('sim-pin');
    const botao    = document.getElementById('sim-ligar');

    const render = () => {
      if (ligado) {
        if (temp < ALVO - BANDA) aquecendo = true;      // liga abaixo de 29,5
        else if (temp >= ALVO)   aquecendo = false;     // desliga ao chegar em 30
      } else aquecendo = false;

      slider.value = temp;
      saida.textContent = temp.toFixed(1).replace('.', ',') + ' °C';
      oledTemp.textContent = temp.toFixed(1);
      sys.textContent = ligado ? (aquecendo ? 'AQUECENDO…' : 'STANDBY') : 'SYS OFF';
      ledRele.classList.toggle('on', aquecendo);
      ledOk.classList.toggle('on', ligado && temp >= ALVO - BANDA && temp <= ALVO + 1.5);
      pino.style.left = ((temp - 15) / 25 * 100) + '%';

      if (!ligado)          status.textContent = 'Sistema desligado. Ligue para simular o controle automático.';
      else if (aquecendo)   status.textContent = 'Temperatura abaixo do alvo → relé LIGADO, aquecendo até ' + ALVO.toFixed(1) + ' °C.';
      else if (temp >= ALVO) status.textContent = 'Alvo atingido → relé DESLIGADO. Zona de conforto ✓';
      else                  status.textContent = 'Temperatura na banda de segurança → aguardando (histerese).';
    };

    const tick = () => {
      if (!ligado)            temp = Math.max(15, temp - 0.03);          // esfria devagar
      else if (aquecendo)     temp = Math.min(ALVO + 0.2, temp + 0.15);  // aquece
      else                    temp = Math.max(ALVO - 0.7, temp - 0.02);  // mantém ~alvo
      render();
    };

    slider.addEventListener('input', () => { temp = parseFloat(slider.value); render(); });
    botao.addEventListener('click', () => {
      ligado = !ligado;
      botao.textContent = ligado ? '⏸ Desligar sistema' : '▶ Ligar sistema';
      botao.classList.toggle('btn-teal', !ligado);
      botao.classList.toggle('btn-line-dark', ligado);
      if (ligado && !timer) timer = setInterval(tick, 300);
      if (!ligado && timer) { clearInterval(timer); timer = null; }
      render();
    });
    render();
  }

  /* ---------- Disco de Newton (Tecnociência) ---------- */
  const disco = document.getElementById('disco');
  const btnDisco = document.getElementById('btn-disco');
  if (disco && btnDisco) {
    btnDisco.addEventListener('click', () => {
      const girando = disco.classList.toggle('girando');
      btnDisco.textContent = girando ? '⏹ Parar o disco' : '▶ Girar o disco';
    });
  }

  /* ---------- Calculadora Q = m · c · ΔT (Tecnociência) ---------- */
  const cVol = document.getElementById('calc-vol');
  if (cVol) {
    const cDt  = document.getElementById('calc-dt');
    const rM   = document.getElementById('calc-massa');
    const rJ   = document.getElementById('calc-j');
    const rKwh = document.getElementById('calc-kwh');
    const calcular = () => {
      const v  = parseFloat(cVol.value) || 0;   // m³
      const dt = parseFloat(cDt.value) || 0;    // °C
      const massaKg = v * 1000;                 // 1 m³ de água ≈ 1000 kg
      const q = massaKg * 4184 * dt;            // c = 4,184 J/g°C = 4184 J/kg°C
      rM.textContent   = massaKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' kg';
      rJ.textContent   = q.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' J';
      rKwh.textContent = (q / 3600000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' kWh';
    };
    cVol.addEventListener('input', calcular);
    cDt.addEventListener('input', calcular);
    calcular();
  }

  /* ---------- Ano automático no rodapé ---------- */
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
});
