/* =========================================================
   Aqua+ · script.js COMPLETO (versão "tudo animado")
   Menu · reveal · contadores · OLED · simulador · calculadora
   + NOVO: barra de progresso · bolhas · tilt 3D · voltar ao topo
   + fluxo interativo · linha do tempo com progresso · checklist
   com carimbo · código "digitando" · confete na equipe · stats pulso
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const podeHover = matchMedia('(hover:hover)').matches;

  /* ---------- estilos injetados (não precisa mexer no CSS) ---------- */
  const st = document.createElement('style');
  st.textContent = `
    #barra-progresso{position:fixed;top:0;left:0;height:4px;background:linear-gradient(90deg,#1fc2ce,#ff8a3d);width:0;z-index:60}
    #voltar-topo{position:fixed;right:18px;bottom:18px;width:48px;height:48px;border-radius:50%;border:0;background:#0f8b98;color:#fff;font-size:1.2rem;cursor:pointer;opacity:0;pointer-events:none;transition:.3s;z-index:55;box-shadow:0 8px 20px rgba(4,51,58,.3)}
    #voltar-topo.mostrar{opacity:1;pointer-events:auto}
    #voltar-topo:hover{background:#1fc2ce;transform:translateY(-3px)}
    .bolha{position:absolute;bottom:-40px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.5),rgba(157,238,243,.12));animation:subir linear infinite;pointer-events:none;z-index:0}
    @keyframes subir{to{transform:translateY(-115vh)}}
    .flow-node{transition:all .3s}
    .flow-node.ativo{border-color:#1fc2ce;box-shadow:0 0 0 4px rgba(31,194,206,.25),0 12px 30px rgba(4,51,58,.18);transform:translateY(-4px)}
    #pulso-fluxo{position:fixed;width:16px;height:16px;border-radius:50%;background:#1fc2ce;box-shadow:0 0 16px #1fc2ce;z-index:70;pointer-events:none;transition:left .6s ease,top .6s ease}
    .tl-progresso{position:absolute;left:14px;top:10px;width:2px;background:linear-gradient(#9deef3,#ff8a3d);z-index:1}
    .checklist li .ok{transform:scale(0)}
    .checklist li.visivel .ok,.checklist li.carimbo .ok{transform:scale(1);transition:transform .45s cubic-bezier(.2,1.6,.4,1)}
    .codigo.digitando pre{animation:revelar 2.4s steps(45) forwards}
    @keyframes revelar{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}
    .stat{cursor:pointer}
    .stat.pulso{animation:popz .35s}
    @keyframes popz{50%{transform:scale(1.06)}}
    .confete{position:fixed;z-index:80;pointer-events:none;font-size:1.15rem;animation:voar 1s ease-out forwards}
    @keyframes voar{to{transform:translate(var(--dx),var(--dy)) rotate(540deg);opacity:0}}
  `;
  document.head.appendChild(st);

  /* ---------- menu mobile ---------- */
  const topbar = document.querySelector('.topbar');
  const toggle = document.querySelector('.nav-toggle');
  if (topbar && toggle) {
    toggle.addEventListener('click', () => {
      const aberto = topbar.classList.toggle('aberto');
      toggle.setAttribute('aria-expanded', String(aberto));
    });
    document.querySelectorAll('.menu a').forEach(l => l.addEventListener('click', () => {
      topbar.classList.remove('aberto'); toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- revelar ao rolar ---------- */
  const reveals = [...document.querySelectorAll('.reveal')];
  if (reduzido || !('IntersectionObserver' in window)) reveals.forEach(el => el.classList.add('visivel'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visivel'); io.unobserve(e.target); }
    }), { threshold: .12 });
    reveals.forEach(el => io.observe(el));
  }

  /* ---------- barra de progresso + voltar ao topo ---------- */
  const barra = document.createElement('div'); barra.id = 'barra-progresso';
  const vTopo = document.createElement('button'); vTopo.id = 'voltar-topo';
  vTopo.setAttribute('aria-label', 'Voltar ao topo'); vTopo.textContent = '↑';
  document.body.append(barra, vTopo);
  vTopo.addEventListener('click', () => scrollTo({ top: 0, behavior: reduzido ? 'auto' : 'smooth' }));
  addEventListener('scroll', () => {
    const h = document.documentElement;
    barra.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    vTopo.classList.toggle('mostrar', h.scrollTop > 600);
  }, { passive: true });

  /* ---------- bolhas nos heróis ---------- */
  if (!reduzido) document.querySelectorAll('.hero, .page-hero').forEach(h => {
    for (let i = 0; i < 12; i++) {
      const b = document.createElement('span'); b.className = 'bolha';
      const s = 6 + Math.random() * 18;
      b.style.width = b.style.height = s + 'px';
      b.style.left = Math.random() * 100 + '%';
      b.style.animationDuration = (7 + Math.random() * 9) + 's';
      b.style.animationDelay = (-Math.random() * 12) + 's';
      h.appendChild(b);
    }
  });

  /* ---------- tilt 3D nos cards ---------- */
  if (podeHover && !reduzido) document.querySelectorAll('.card').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = 'translateY(-5px) perspective(700px) rotateY(' + (x * 7) + 'deg) rotateX(' + (-y * 7) + 'deg)';
    });
    c.addEventListener('mouseleave', () => { c.style.transform = ''; });
  });

  /* ---------- contadores ---------- */
  const nums = [...document.querySelectorAll('.num[data-count]')];
  if (nums.length) {
    const fmt = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
    const animar = el => {
      const alvo = parseFloat(el.dataset.count), dec = Number(el.dataset.dec || 0);
      if (reduzido) { el.textContent = fmt(alvo, dec); return; }
      const t0 = performance.now();
      const passo = t => {
        const p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(alvo * e, dec);
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    };
    const io2 = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { animar(e.target); io2.unobserve(e.target); }
    }), { threshold: .6 });
    nums.forEach(n => io2.observe(n));
  }

  /* ---------- stats pulso ao clicar ---------- */
  document.querySelectorAll('.stat').forEach(s => s.addEventListener('click', () => {
    s.classList.remove('pulso'); void s.offsetWidth; s.classList.add('pulso');
  }));

  /* ---------- OLED vivo da home ---------- */
  const oledHome = document.querySelector('[data-oled-temp]');
  if (oledHome && !reduzido) {
    let t = 27.4;
    setInterval(() => {
      t += (Math.random() - .48) * .2; t = Math.max(26.6, Math.min(29.4, t));
      oledHome.textContent = t.toFixed(1);
    }, 1600);
  }

  /* ---------- FLUXO interativo (Robótica) ---------- */
  const flow = document.querySelector('.flow');
  if (flow) {
    const nos = [...flow.querySelectorAll('.flow-node')];
    const btn = document.createElement('button');
    btn.textContent = '▶ Executar ciclo completo';
    btn.style.cssText = 'margin:1.5rem auto 0;display:block;padding:.75rem 1.5rem;border-radius:999px;border:0;background:#0f8b98;color:#fff;font-weight:700;cursor:pointer;font-size:.95rem';
    const msg = document.createElement('p');
    msg.setAttribute('aria-live', 'polite');
    msg.style.cssText = 'text-align:center;margin-top:.9rem;font-family:var(--mono);font-size:.85rem;color:#0f8b98;min-height:1.4em';
    flow.after(msg, btn);
    const pulso = document.createElement('div'); pulso.id = 'pulso-fluxo'; document.body.appendChild(pulso);
    pulso.style.left = '-100px';
    let rodando = false;
    const centro = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    btn.addEventListener('click', () => {
      if (rodando) return; rodando = true;
      const textos = [
        '📡 LEITURA: sensor mede a água → 26,8 °C…',
        '🧠 PROCESSAMENTO: Arduino compara com o alvo (30 °C)…',
        '⚙️ AÇÃO: relé LIGA o aquecedor + display atualiza!'
      ];
      pulso.style.transition = 'none';
      const p0 = centro(nos[0]); pulso.style.left = (p0.x - 8) + 'px'; pulso.style.top = (p0.y - 8) + 'px';
      requestAnimationFrame(() => { pulso.style.transition = ''; });
      let i = 0;
      (function passo() {
        nos.forEach(n => n.classList.remove('ativo'));
        if (i < nos.length) {
          nos[i].classList.add('ativo');
          const p = centro(nos[i]);
          pulso.style.left = (p.x - 8) + 'px'; pulso.style.top = (p.y - 8) + 'px';
          msg.textContent = textos[i]; i++;
          setTimeout(passo, 1000);
        } else {
          msg.textContent = '✅ Ciclo concluído! O sistema repete esse loop para sempre.';
          setTimeout(() => { nos.forEach(n => n.classList.remove('ativo')); pulso.style.left = '-100px'; rodando = false; }, 1400);
        }
      })();
    });
  }

  /* ---------- linha do tempo com progresso (Desenvolvimento) ---------- */
  const tl = document.querySelector('.timeline');
  if (tl) {
    const prog = document.createElement('div'); prog.className = 'tl-progresso'; tl.appendChild(prog);
    const att = () => {
      const r = tl.getBoundingClientRect();
      prog.style.height = Math.max(0, Math.min(r.height, innerHeight * .6 - r.top)) + 'px';
    };
    addEventListener('scroll', att, { passive: true }); att();
  }

  /* ---------- checklist com carimbo (Resultados) ---------- */
  const ioC = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('carimbo'); ioC.unobserve(e.target); }
  }), { threshold: .5 });
  document.querySelectorAll('.checklist li').forEach(li => ioC.observe(li));

  /* ---------- código "digitando" (Programação) ---------- */
  const cod = document.querySelector('.codigo');
  if (cod) new IntersectionObserver((es, io) => es.forEach(e => {
    if (e.isIntersecting) { cod.classList.add('digitando'); io.disconnect(); }
  }), { threshold: .3 }).observe(cod);

  /* ---------- confete na equipe ---------- */
  document.querySelectorAll('.eq-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.title = 'Clique! 🎉';
    card.addEventListener('click', e => {
      const em = ['💧', '✨', '🎉', '💙', ''];
      for (let i = 0; i < 14; i++) {
        const s = document.createElement('span');
        s.className = 'confete'; s.textContent = em[i % em.length];
        s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
        s.style.setProperty('--dx', (Math.random() * 180 - 90) + 'px');
        s.style.setProperty('--dy', (-Math.random() * 150 - 40) + 'px');
        document.body.appendChild(s); setTimeout(() => s.remove(), 1000);
      }
    });
  });

  /* ---------- simulador de temperatura (Programação) ---------- */
  const slider = document.getElementById('sim-temp');
  if (slider) {
    const ALVO = 30, BANDA = .5;
    let temp = parseFloat(slider.value), ligado = false, aquecendo = false, timer = null;
    const $ = id => document.getElementById(id);
    const saida = $('sim-out'), oledT = $('sim-oled-temp'), status = $('sim-status'),
          sys = $('sim-sys'), ledR = $('led-rele'), ledO = $('led-ok'), pino = $('sim-pin'), botao = $('sim-ligar');
    const render = () => {
      if (ligado) { if (temp < ALVO - BANDA) aquecendo = true; else if (temp >= ALVO) aquecendo = false; }
      else aquecendo = false;
      slider.value = temp;
      saida.textContent = temp.toFixed(1).replace('.', ',') + ' °C';
      oledT.textContent = temp.toFixed(1);
      sys.textContent = ligado ? (aquecendo ? 'AQUECENDO…' : 'STANDBY') : 'SYS OFF';
      ledR.classList.toggle('on', aquecendo);
      ledO.classList.toggle('on', ligado && temp >= ALVO - BANDA && temp <= ALVO + 1.5);
      pino.style.left = ((temp - 15) / 25 * 100) + '%';
      status.textContent = !ligado ? 'Sistema desligado. Ligue para simular o controle automático.'
        : aquecendo ? 'Temperatura abaixo do alvo → relé LIGADO, aquecendo até 30,0 °C.'
        : temp >= ALVO ? 'Alvo atingido → relé DESLIGADO. Zona de conforto ✓'
        : 'Temperatura na banda de segurança → aguardando (histerese).';
    };
    const tick = () => {
      if (!ligado) temp = Math.max(15, temp - .03);
      else if (aquecendo) temp = Math.min(ALVO + .2, temp + .15);
      else temp = Math.max(ALVO - .7, temp - .02);
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

  /* ---------- calculadora Q = m·c·ΔT (Tecnociência) ---------- */
  const cVol = document.getElementById('calc-vol');
  if (cVol) {
    const cDt = document.getElementById('calc-dt');
    const calc = () => {
      const v = parseFloat(cVol.value) || 0, dt = parseFloat(cDt.value) || 0;
      const m = v * 1000, q = m * 4184 * dt;
      document.getElementById('calc-massa').textContent = m.toLocaleString('pt-BR') + ' kg';
      document.getElementById('calc-j').textContent = q.toLocaleString('pt-BR') + ' J';
      document.getElementById('calc-kwh').textContent = (q / 3600000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' kWh';
    };
    cVol.addEventListener('input', calc); cDt.addEventListener('input', calc); calc();
  }

  /* ---------- ano no rodapé ---------- */
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
});
