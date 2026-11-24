/* Scene builders.
   Each builder gets (root, k):
     k.T('phrase')  -> the time (seconds) that phrase is spoken in this scene's audio
     k.at(t, fn)    -> run fn when audio reaches t
     k.tween(t, d, fn(p)) -> animate p 0..1 from t over d seconds (follows the audio, so it pauses too)
   Any element with data-at="phrase" gets class "in" (reveal) when that phrase is spoken.
   data-at="@1.5" means at 1.5 seconds. data-gone="phrase" fades it out. */

const SCENES = {};
const ACCENTS = {
  1: ['#fbbf24', '#fb7185'], 2: ['#a78bfa', '#60a5fa'], 3: ['#fb7185', '#fbbf24'],
  4: ['#2dd4bf', '#a78bfa'], 5: ['#2dd4bf', '#fb7185'], 6: ['#fb7185', '#a78bfa'],
  7: ['#60a5fa', '#2dd4bf'], 8: ['#34d399', '#2dd4bf'], 9: ['#a78bfa', '#2dd4bf'],
  10: ['#fbbf24', '#2dd4bf'],
};

let _uid = 0;
const uid = p => p + (++_uid);
const W = (text, cls = '', off = 0) =>
  text.split(' ').map((w, i) => `<span class="${cls}" style="animation-delay:${(i + off) * 90}ms">${w}</span>`).join(' ');

/* ---------- illustrations ---------- */
function clock(o = {}) {
  const g = uid('cf');
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const b = i % 5 === 0;
    ticks += `<line x1="300" y1="${b ? 40 : 48}" x2="300" y2="${b ? 82 : 64}" class="${b ? 'tk-b' : 'tk'}" transform="rotate(${i * 6} 300 300)"/>`;
  }
  return `<svg viewBox="0 0 600 600" class="clock">
    <defs><radialGradient id="${g}" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#1d2850"/><stop offset="1" stop-color="#090e22"/></radialGradient></defs>
    <circle cx="300" cy="300" r="292" class="rim"/>
    <circle cx="300" cy="300" r="278" fill="url(#${g})"/>
    ${ticks}
    <g class="hand hr" style="transform:rotate(${o.h ?? 305}deg)"><line x1="300" y1="320" x2="300" y2="160" class="hl"/></g>
    <g class="hand mn" style="transform:rotate(${o.m ?? 60}deg)"><line x1="300" y1="330" x2="300" y2="92" class="ml"/></g>
    <g class="hand sc"><line x1="300" y1="350" x2="300" y2="74" class="sl"/><circle cx="300" cy="300" r="14" class="i-fill"/></g>
  </svg>`;
}

function chairSVG() {
  const g = uid('ch');
  const caster = (x, y) => `<circle cx="${x}" cy="${y}" r="15" fill="#141b33" stroke="#8b9bd1" stroke-width="4"/>`;
  return `<svg viewBox="0 0 500 620">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46579a"/><stop offset="1" stop-color="#232f5c"/></linearGradient></defs>
    <rect x="130" y="30" width="240" height="290" rx="64" fill="url(#${g})" stroke="#7f93d8" stroke-width="4"/>
    <rect x="168" y="74" width="164" height="200" rx="44" fill="none" stroke="rgba(255,255,255,.13)" stroke-width="3"/>
    <rect x="235" y="310" width="30" height="40" fill="#2a3760"/>
    <path d="M92 296 h56 v62" fill="none" stroke="#5d71b3" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M408 296 h-56 v62" fill="none" stroke="#5d71b3" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="96" y="340" width="308" height="74" rx="37" fill="url(#${g})" stroke="#7f93d8" stroke-width="4"/>
    <rect x="236" y="414" width="28" height="86" rx="6" fill="#8b9bd1"/>
    <path d="M250 505 L105 556 M250 505 L395 556 M250 505 L165 588 M250 505 L335 588 M250 505 L250 574" stroke="#5d71b3" stroke-width="18" stroke-linecap="round"/>
    ${caster(105, 562)}${caster(395, 562)}${caster(165, 594)}${caster(335, 594)}${caster(250, 580)}
  </svg>`;
}

function wheel(x, y) {
  return `<g transform="translate(${x} ${y})"><circle r="60" fill="#0b0f1a"/><circle r="55" fill="#111827" stroke="#374151" stroke-width="4"/>
    <g class="spokes"><circle r="24" fill="#9ca3af"/><rect x="-4" y="-46" width="8" height="92" rx="4" fill="#4b5563"/><rect x="-46" y="-4" width="92" height="8" rx="4" fill="#4b5563"/></g></g>`;
}

function busSVG() {
  const g = uid('bus');
  let up = '', lo = '';
  for (let i = 0; i < 7; i++) up += `<rect x="${100 + i * 126}" y="76" width="108" height="100" rx="16" class="win"/>`;
  for (let i = 0; i < 5; i++) lo += `<rect x="${232 + i * 124}" y="252" width="106" height="104" rx="14" class="win"/>`;
  return `<svg viewBox="0 0 1100 560" class="bus">
    <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4b4b"/><stop offset="1" stop-color="#b4232a"/></linearGradient></defs>
    <ellipse cx="550" cy="518" rx="520" ry="20" fill="rgba(0,0,0,.45)"/>
    <rect x="40" y="34" width="1010" height="412" rx="46" fill="url(#${g})"/>
    <rect x="40" y="196" width="1010" height="30" fill="#f1e4c8"/>
    ${up}${lo}
    <rect x="56" y="240" width="150" height="196" rx="10" fill="#3a1518"/>
    <path d="M66 430 h22 v-30 h22 v-30 h22 v-30 h22 v-30 h22 v-30 h22 v-36" class="stairs"/>
    <line x1="208" y1="240" x2="208" y2="436" stroke="#e5e7eb" stroke-width="6"/>
    <rect x="866" y="252" width="152" height="104" rx="14" class="win"/>
    <g class="driver"><circle cx="925" cy="286" r="20" class="fig-h"/><rect x="903" y="308" width="44" height="46" rx="14" class="fig-b"/>
      <ellipse cx="978" cy="322" rx="8" ry="22" fill="none" stroke="#94a3b8" stroke-width="6"/></g>
    <circle cx="1034" cy="404" r="14" fill="#fde68a" class="headlight"/>
    <g class="conductor"><circle cx="110" cy="330" r="18" class="fig-h"/><rect x="90" y="350" width="40" height="48" rx="13" class="fig-b2"/>
      <rect x="126" y="362" width="16" height="20" rx="4" fill="#f8fafc"/></g>
    <rect x="852" y="236" width="182" height="136" rx="22" class="ring ring-driver"/>
    <rect x="44" y="60" width="182" height="388" rx="22" class="ring ring-cond"/>
    ${wheel(232, 450)}${wheel(862, 450)}
  </svg>`;
}

function bodySVG() {
  return `<svg viewBox="0 0 300 700" class="body5">
    <rect x="48" y="132" width="36" height="210" rx="18" class="b-part" transform="rotate(10 66 140)"/>
    <rect x="216" y="132" width="36" height="210" rx="18" class="b-part" transform="rotate(-10 234 140)"/>
    <rect x="94" y="320" width="54" height="360" rx="27" class="b-part"/>
    <rect x="152" y="320" width="54" height="360" rx="27" class="b-part"/>
    <rect x="88" y="122" width="124" height="226" rx="44" class="b-part"/>
    <rect x="133" y="100" width="34" height="30" class="b-part"/>
    <circle cx="150" cy="62" r="46" class="b-part"/>
    <g class="muscles">
      <ellipse cx="121" cy="440" rx="16" ry="70"/><ellipse cx="179" cy="440" rx="16" ry="70"/>
      <ellipse cx="121" cy="598" rx="13" ry="50"/><ellipse cx="179" cy="598" rx="13" ry="50"/>
    </g>
  </svg>`;
}

function couchPotatoSVG() {
  const shoe = x => `<g><path d="M${x} 535 h70 q24 0 26 24 v8 h-112 q-6 -32 16 -32z" fill="#f8fafc"/>
    <rect x="${x - 18}" y="563" width="114" height="10" rx="5" fill="#94a3b8"/>
    <path d="M${x + 12} 549 h34" stroke="#2dd4bf" stroke-width="6" stroke-linecap="round"/></g>`;
  return `<svg viewBox="0 0 760 620" class="potato-svg">
    <ellipse cx="380" cy="592" rx="340" ry="18" fill="rgba(0,0,0,.4)"/>
    <rect x="90" y="196" width="580" height="250" rx="60" fill="#4c3fa3"/>
    <rect x="40" y="290" width="112" height="232" rx="48" fill="#5a4bc2"/>
    <rect x="608" y="290" width="112" height="232" rx="48" fill="#5a4bc2"/>
    <rect x="120" y="400" width="520" height="122" rx="36" fill="#6a5ad6"/>
    <line x1="380" y1="410" x2="380" y2="512" stroke="rgba(0,0,0,.15)" stroke-width="4"/>
    <rect x="92" y="518" width="26" height="50" rx="6" fill="#2b2366"/><rect x="642" y="518" width="26" height="50" rx="6" fill="#2b2366"/>
    <g class="potato">
      <path d="M330 468 L300 545" stroke="#c8925a" stroke-width="22" stroke-linecap="round"/>
      <path d="M430 468 L460 545" stroke="#c8925a" stroke-width="22" stroke-linecap="round"/>
      <path d="M252 362 Q206 400 222 444" stroke="#c8925a" stroke-width="20" fill="none" stroke-linecap="round"/>
      <path d="M508 362 Q560 384 562 334" stroke="#c8925a" stroke-width="20" fill="none" stroke-linecap="round"/>
      <ellipse cx="380" cy="330" rx="140" ry="165" fill="#c8925a"/>
      <ellipse cx="318" cy="420" rx="12" ry="8" fill="#a8743f"/><ellipse cx="452" cy="268" rx="9" ry="6" fill="#a8743f"/>
      <ellipse cx="300" cy="300" rx="7" ry="5" fill="#a8743f"/><ellipse cx="460" cy="400" rx="10" ry="7" fill="#a8743f"/>
      <path d="M260 238 Q380 202 500 238 L498 268 Q380 232 262 268Z" fill="#2dd4bf"/>
      <ellipse cx="335" cy="318" rx="21" ry="25" fill="#fff"/><circle cx="341" cy="324" r="11" fill="#0b1020"/>
      <ellipse cx="425" cy="318" rx="21" ry="25" fill="#fff"/><circle cx="431" cy="324" r="11" fill="#0b1020"/>
      <path d="M312 296 q23 -8 46 0 M402 296 q23 -8 46 0" stroke="#c8925a" stroke-width="14" stroke-linecap="round"/>
      <path d="M345 384 Q380 408 415 384" stroke="#6b3f1d" stroke-width="7" fill="none" stroke-linecap="round"/>
      <rect x="548" y="282" width="28" height="60" rx="8" fill="#1f2937"/><circle cx="562" cy="298" r="5" fill="#fb7185"/>
    </g>
    ${shoe(256)}${shoe(436)}
    <g transform="translate(40 560)"><rect x="0" y="12" width="80" height="10" rx="5" fill="#64748b"/>
      <rect x="-6" y="0" width="16" height="34" rx="4" fill="#94a3b8"/><rect x="70" y="0" width="16" height="34" rx="4" fill="#94a3b8"/></g>
  </svg>`;
}

const ICON = {
  info: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.2" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  drop: `<svg viewBox="0 0 100 100"><path d="M50 8C50 8 20 44 20 64a30 30 0 0 0 60 0C80 44 50 8 50 8z" class="i-fill"/><text x="50" y="78" text-anchor="middle" class="i-txt">2</text></svg>`,
  heart: `<svg viewBox="0 0 100 100"><path d="M50 88C22 66 8 50 8 33 8 20 18 10 31 10c8 0 15 4 19 11 4-7 11-11 19-11 13 0 23 10 23 23 0 17-14 33-42 55z" class="i-fill"/><path d="M20 46h18l6-12 8 24 6-12h22" class="i-line"/></svg>`,
  cell: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" class="i-fill"/><circle cx="44" cy="46" r="13" class="i-dark"/><circle cx="68" cy="64" r="6" class="i-dark"/><circle cx="64" cy="32" r="4" class="i-dark"/><circle cx="32" cy="70" r="5" class="i-dark"/></svg>`,
  hourglass: `<svg viewBox="0 0 100 100"><path d="M24 10h52M24 90h52" class="i-line"/><path d="M31 10c0 26 19 31 19 40S31 64 31 90h38c0-26-19-31-19-40s19-14 19-40z" class="i-out"/><path d="M38 84h24c-2-10-8-14-12-16-4 2-10 6-12 16z" class="i-fill"/><path d="M41 24h18c-2 6-6 9-9 11-3-2-7-5-9-11z" class="i-fill" opacity=".5"/></svg>`,
  runner: `<svg viewBox="0 0 100 100"><circle cx="62" cy="15" r="9" class="i-fill"/><path d="M58 30 L46 58" class="i-limb"/><path d="M55 36 L68 48 L80 42" class="i-limb"/><path d="M55 36 L40 42 L32 54" class="i-limb"/><path d="M46 58 L62 72 L58 92" class="i-limb"/><path d="M46 58 L36 76 L18 80" class="i-limb"/><path d="M6 40h14M2 52h14M8 64h12" class="i-speed"/></svg>`,
  walker: `<svg viewBox="0 0 100 100"><circle cx="52" cy="14" r="9" class="i-fill"/><path d="M50 28 L48 58" class="i-limb"/><path d="M50 34 L62 50 M50 34 L38 50" class="i-limb"/><path d="M48 58 L60 76 L62 92 M48 58 L40 76 L30 90" class="i-limb"/></svg>`,
  headset: `<svg viewBox="0 0 100 100"><g class="stand"><circle cx="50" cy="20" r="10" class="i-fill"/><path d="M36 21a14 14 0 0 1 28 0" class="i-band"/><rect x="32" y="17" width="7" height="11" rx="3" fill="#fff"/><rect x="61" y="17" width="7" height="11" rx="3" fill="#fff"/><path d="M36 28 q2 8 11 8" class="i-band"/><path d="M50 37 L50 66 M50 43 L37 57 M50 43 L63 57 M50 66 L41 93 M50 66 L59 93" class="i-limb"/></g></svg>`,
  lap: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" class="i-track"/><path d="M50 14a36 36 0 0 1 34 24" class="i-band"/><path d="M78 30l7 9 3-11" class="i-band"/><g class="orbit"><circle cx="50" cy="14" r="9" class="i-fill"/></g><text x="50" y="58" text-anchor="middle" style="font:800 20px 'Segoe UI';fill:#fff">LAP</text></svg>`,
  glass: () => {
    const c = uid('gc');
    return `<svg viewBox="0 0 100 100"><defs><clipPath id="${c}"><path d="M32 22h36l-6 66H38z"/></clipPath></defs><g clip-path="url(#${c})"><rect class="water i-fill" x="20" y="44" width="60" height="60" opacity=".85"/></g><path d="M32 22h36l-6 66H38z" class="i-out2"/><path d="M58 8 q10 0 10 10" class="i-band" opacity=".5"/></svg>`;
  },
  bell: `<svg viewBox="0 0 100 100"><g class="ring-bell"><path d="M50 14c-14 0-22 12-22 26v18l-8 12h60l-8-12V40c0-14-8-26-22-26z" class="i-fill"/><circle cx="50" cy="80" r="7" class="i-fill"/></g><circle cx="78" cy="22" r="16" fill="#fb7185"/><text x="78" y="28" text-anchor="middle" class="i-badge">30</text></svg>`,
};

/* ---------- Particle bloodstream (scene 5) ---------- */
function vessel(canvas, k) {
  const ctx = canvas.getContext('2d');
  const Wd = canvas.width, H = canvas.height, cy = H / 2, base = H * 0.38;
  const st = { speed: 1, pinch: 0, sugar: 0, fat: 0 };
  const P = [];
  const add = (type, x) => P.push({ type, x: x ?? Math.random() * Wd, y: Math.random() * 2 - 1, v: 0.7 + Math.random() * 0.6, ph: Math.random() * 6.28, rot: Math.random() * 6.28 });
  for (let i = 0; i < 44; i++) add('rbc');
  const half = x => base - st.pinch * base * 0.62 * Math.exp(-(((x - Wd * 0.62) / 95) ** 2));
  let last = performance.now(), nS = 0, nF = 0;
  function frame(now) {
    if (!k.alive()) return;
    const dt = Math.min(50, now - last); last = now;
    if (!k.isPaused()) {
      while (nS < st.sugar) { add('sugar', -10 - Math.random() * 260); nS++; }
      while (nF < st.fat) { add('fat', -10 - Math.random() * 260); nF++; }
      for (const p of P) {
        const f = Math.max(0.22, half(p.x) / base);
        p.x += p.v * st.speed * dt * 0.13 * (p.type === 'rbc' ? 1 : 0.8) * (0.35 + 0.65 * f);
        p.ph += dt * 0.003; p.rot += dt * 0.001;
        if (p.x > Wd + 20) { p.x = -20; p.y = Math.random() * 2 - 1; }
      }
    }
    ctx.clearRect(0, 0, Wd, H);
    // vessel body
    ctx.beginPath();
    for (let x = 0; x <= Wd; x += 8) ctx.lineTo(x, cy - half(x));
    for (let x = Wd; x >= 0; x -= 8) ctx.lineTo(x, cy + half(x));
    ctx.closePath();
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(190,24,60,.30)'); gr.addColorStop(.5, 'rgba(120,16,44,.22)'); gr.addColorStop(1, 'rgba(190,24,60,.30)');
    ctx.fillStyle = gr; ctx.fill();
    ctx.save(); ctx.shadowColor = '#fb7185'; ctx.shadowBlur = 18; ctx.strokeStyle = 'rgba(251,113,133,.8)'; ctx.lineWidth = 6;
    ctx.beginPath(); for (let x = 0; x <= Wd; x += 8) ctx.lineTo(x, cy - half(x)); ctx.stroke();
    ctx.beginPath(); for (let x = 0; x <= Wd; x += 8) ctx.lineTo(x, cy + half(x)); ctx.stroke();
    ctx.restore();
    for (const p of P) {
      const h = half(p.x);
      const y = cy + p.y * Math.max(4, h - 16) + Math.sin(p.ph) * 3;
      if (p.type === 'rbc') {
        ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(p.x, y, 11, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(p.x, y, 5, 0, 6.283); ctx.fill();
      } else if (p.type === 'sugar') {
        ctx.save(); ctx.translate(p.x, y); ctx.rotate(p.rot); ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12;
        ctx.fillStyle = '#fbbf24'; ctx.fillRect(-7, -7, 14, 14); ctx.restore();
      } else {
        ctx.save(); ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 10; ctx.fillStyle = '#fef3c7';
        ctx.beginPath(); ctx.arc(p.x, y, 9, 0, 6.283); ctx.fill(); ctx.restore();
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return st;
}

/* ================= SCENES ================= */

SCENES[1] = (r, k) => {
  r.innerHTML = `
  <div class="abs fade in" style="left:150px;top:170px;width:660px;height:660px">
    <div class="s1-glow"></div><div class="s1-clock">${clock()}</div>
  </div>
  <div class="abs" style="left:900px;top:250px;width:960px">
    <div class="eyebrow rv" data-at="quick">Quick question</div>
    <div class="h1 stag" data-at="when" style="margin-top:30px">${W('When did you')}<br>${W('last', '', 3)} ${W('stand up?', 'grad', 4)}</div>
    <div class="body rv" data-at="be honest" style="margin-top:48px;font-size:46px;font-style:italic">Be honest.</div>
    <div class="chip rv" data-at="yeah" style="margin-top:34px"><span class="d"></span>We've all been there.</div>
  </div>`;
};

SCENES[2] = (r, k) => {
  r.innerHTML = `
  <div class="abs fade in" style="left:180px;top:200px;width:500px;height:620px"><div class="chairwrap">${chairSVG()}</div></div>
  <div class="abs floor" style="left:150px;top:792px;width:560px"></div>
  <div class="abs" style="left:820px;top:160px;width:960px">
    <div class="eyebrow rv" data-at="@0.1">The nature of the job</div>
    <div class="h2 stag" data-at="ten-hour" style="margin-top:18px">${W('10-hour')} ${W('shifts.', 'grad', 1)}</div>
    <div class="body rv" data-at="longer" style="margin-top:14px">We sit a lot longer than we realize.</div>
    <div class="s2-row rv" data-at="some days" style="margin-top:40px">
      <div class="s2-clock">${clock({ h: 270, m: 0 })}</div>
      <div><div class="label muted">Hours in the chair</div>
        <div class="s2-num"><span class="hrs">0</span><small>hrs</small></div>
        <div class="label muted" style="font-size:22px">straight, no break</div></div>
    </div>
    <div class="s2-pain" style="margin-top:40px">
      <div class="chip pain pop" data-at="stiff"><span class="d"></span>Stiff hips</div>
      <div class="chip pain pop" data-at="tight"><span class="d"></span>Tight back</div>
      <div class="chip pain pop" data-at="legs"><span class="d"></span>Heavy legs</div>
    </div>
  </div>`;
  const ck = k.q('.s2-clock .clock'), hrs = k.q('.hrs');
  const t0 = k.T('some days'), t1 = k.T('straight') + 0.4;
  k.at(t0, () => ck.classList.add('spin'));
  k.tween(t0, Math.max(0.8, t1 - t0), p => { hrs.textContent = Math.round(p * 7); });
  k.at(t1 + 0.2, () => ck.classList.remove('spin'));
};

SCENES[3] = (r, k) => {
  r.innerHTML = `
  <div class="abs" data-gone="kick off" style="left:0;right:0;top:146px;text-align:center">
    <div class="eyebrow rv" data-at="1950s">London · 1950s</div>
    <div class="h3 rv" data-at="jerry" style="margin-top:14px">Jerry Morris's double-decker bus study</div>
  </div>
  <div class="abs rv" data-at="kick off" style="left:0;right:0;top:146px;text-align:center">
    <div class="eyebrow">The legacy</div>
    <div class="h3" style="margin-top:14px">It helped launch the science of <span class="grad">exercise &amp; heart health</span></div>
  </div>
  <div class="abs s3-road" style="left:0;right:0;top:794px"></div>
  <div class="abs s3-busw" style="left:460px;top:322px;width:1000px">${busSVG()}</div>
  <div class="abs callout c-cond pop" data-at="conductor" data-gone="drivers" style="left:250px;top:290px"><b>The conductor</b><span>up and down the stairs all day</span></div>
  <div class="abs callout c-driver pop" data-at="driver" data-gone="drivers" style="left:1300px;top:290px"><b>The driver</b><span>sat all day</span></div>
  <div class="abs card s3-card pop" data-at="drivers" style="left:540px;top:310px;width:840px">
    <div class="eyebrow" style="color:#fb7185">What they found</div>
    <div class="s3-line rv" data-at="heart disease"><span class="dotc"></span>Drivers had <b>more heart disease</b></div>
    <div class="s3-stat rv" data-at="twice"><div class="big">2×</div><div>sudden heart-related deaths<br><span class="muted">compared with conductors</span></div></div>
  </div>`;
  const bw = k.q('.s3-busw');
  k.at(k.T('driver'), () => bw.classList.add('hl-driver'));
  k.at(k.T('conductor'), () => bw.classList.add('hl-cond'));
  k.at(k.T('drivers'), () => bw.classList.add('dim'));
};

SCENES[4] = (r, k) => {
  const L = (t, o) => [...t].map((c, i) => `<span style="animation-delay:${(i + o) * 60}ms">${c}</span>`).join('');
  r.innerHTML = `
  <div class="abs" style="left:0;right:0;top:180px;text-align:center">
    <div class="eyebrow rv" data-at="nickname">There's a nickname for this</div>
    <div class="s4-title letters" data-at="sitting disease"><span class="ln l1">${L('SITTING', 0)}</span><span class="ln l2">${L('DISEASE', 7)}</span></div>
    <div class="chip rv" data-at="official" style="margin-top:44px">${ICON.info}Not an official diagnosis</div>
    <div class="body rv" data-at="just a name" style="margin-top:28px">A name for what builds up when we sit for hours without a break.</div>
  </div>`;
};

SCENES[5] = (r, k) => {
  const card = (sym, txt, at, col) => `<div class="card s5-card pop" data-at="${at}"><div class="ar" style="background:${col};box-shadow:0 0 26px ${col}">${sym}</div><div class="tx">${txt}</div></div>`;
  r.innerHTML = `
  <div class="abs fade in" style="left:180px;top:150px;width:300px;height:690px">${bodySVG()}</div>
  <div class="abs s5-zzw" style="left:420px;top:470px"><span>Z</span><span>z</span><span>z</span></div>
  <div class="abs" style="left:600px;top:146px;width:1180px;display:flex;justify-content:space-between;align-items:center">
    <div class="eyebrow rv" data-at="@0">What's actually going on</div>
    <div class="s5-legend rv" data-at="sugar"><span><i style="background:#e11d48"></i>Blood cells</span><span><i style="background:#fbbf24"></i>Sugar</span><span><i style="background:#fef3c7"></i>Fat</span></div>
  </div>
  <div class="abs s5-vessel fade" data-at="@0.3" style="left:600px;top:200px;width:1180px;height:290px"><canvas width="1180" height="290"></canvas></div>
  <div class="abs s5-cards" style="left:600px;top:524px;width:1180px">
    ${card('Zz', 'Leg muscles go idle', 'sleep', '#94a3b8')}
    ${card('↑', 'Sugar stays in your blood', 'sugar', '#fbbf24')}
    ${card('↓', 'Fat-burning enzymes drop', 'enzymes', '#a78bfa')}
    ${card('↓', 'Good cholesterol falls', 'cholesterol', '#2dd4bf')}
    ${card('↑', 'Blood pressure rises', 'pressure', '#fb7185')}
  </div>`;
  const v = vessel(k.q('canvas'), k);
  k.at(k.T('biggest muscles'), () => r.classList.add('flex'));
  k.at(k.T('sleep'), () => { r.classList.remove('flex'); r.classList.add('asleep'); v.speed = 0.45; });
  k.tween(k.T('sugar'), 2.5, p => { v.sugar = Math.round(p * 34); });
  k.tween(k.T('fat'), 2.5, p => { v.fat = Math.round(p * 26); });
  k.tween(k.T('kinks'), 1.3, p => { v.pinch = p; });
};

SCENES[6] = (r, k) => {
  const risk = (ico, label, at) => `<div class="card s6-risk pop" data-at="${at}"><div class="s6-ico">${ico}</div><div class="s6-lab">${label}</div></div>`;
  r.innerHTML = `
  <div class="abs" data-gone="twenty twenty-five" style="left:160px;top:150px;width:1600px">
    <div class="eyebrow rv" data-at="stretch">Over the long run, too much sitting is linked to</div>
    <div class="s6-grid">
      ${risk(ICON.drop, 'Type 2 diabetes', 'type two')}${risk(ICON.heart, 'Heart disease', 'heart disease')}
      ${risk(ICON.cell, 'Certain cancers', 'cancers')}${risk(ICON.hourglass, 'Dying earlier', 'dying')}
    </div>
    <div class="card s6-cmp rv" data-at="one big analysis">
      <div><div class="big">8+ hrs</div><div class="sm muted">sitting a day,<br>no physical activity</div></div>
      <div class="s6-approx rv" data-at="similar">≈</div>
      <div class="s6-cmp-r"><div class="chip pop" data-at="obesity">Obesity</div><div class="chip pop" data-at="smoking">Smoking</div></div>
      <div class="s6-cmp-cap muted rv" data-at="similar">similar<br>risk of death</div>
    </div>
  </div>
  <div class="abs" style="left:160px;top:150px;width:1600px">
    <div class="eyebrow rv" data-at="twenty twenty-five">2025 heart study · risk spikes above</div>
    <div class="s6-c-row">
      <div class="s6-ring fade" data-at="twenty twenty-five">
        <svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="170" class="trk"/><circle cx="200" cy="200" r="170" class="arc" stroke-dasharray="1068" stroke-dashoffset="1068"/></svg>
        <div class="s6-ring-num"><span class="hv">0.0</span><small>hours a day</small><em>of ~16 waking hours</em></div>
      </div>
      <div class="s6-barw rv" data-at="think about it">
        <div class="h3">Think about a normal day…</div>
        <div class="s6-bar">
          <div class="seg s-shift" data-at="long shift" style="--w:48%">Long shift</div>
          <div class="seg s-din" data-at="dinner" style="--w:11%">Dinner</div>
          <div class="seg s-couch" data-at="couch" style="--w:21%">Couch</div>
          <div class="s6-th" style="left:66.25%"><span>~10.6 hrs</span></div>
        </div>
        <div class="s6-scale"><span>Wake up</span><span>Bedtime</span></div>
        <div class="h3 coral rv" data-at="adds up" style="margin-top:30px">That adds up fast.</div>
      </div>
    </div>
  </div>`;
  const arc = k.q('.arc'), hv = k.q('.hv'), C = 1068;
  const t0 = k.T('twenty twenty-five') + 0.5, t1 = k.T('half') + 0.35;
  k.tween(t0, Math.max(1, t1 - t0), p => {
    const v = 10.6 * p;
    hv.textContent = v.toFixed(1);
    arc.style.strokeDashoffset = C * (1 - v / 16);
  });
};

SCENES[7] = (r, k) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => `<span style="animation-delay:${i * 130}ms">${d}</span>`).join('');
  r.innerHTML = `
  <div class="abs" data-gone="researchers" style="inset:0">
    <div class="abs s7-run fade in" style="left:190px;top:210px;width:440px;height:440px"><div class="s7-halo"></div>${ICON.runner}</div>
    <div class="abs" style="left:730px;top:150px;width:1060px">
      <div class="eyebrow rv" data-at="gym">Can you work it off at the gym?</div>
      <div class="h2 rv" data-at="partly" style="margin-top:12px">Partly<span class="grad">.</span>
        <span class="chip rv" data-at="million" style="vertical-align:middle;margin-left:24px">1 million+ people studied</span></div>
      <div class="s7-big rv" data-at="sixty"><span class="grad">60–75</span><small>min a day</small></div>
      <div class="body rv" data-at="moderate">of moderate exercise to offset a long day of sitting</div>
      <div class="rv" data-at="every single day" style="margin-top:26px"><div class="s7-days" data-at="every single day" data-delay=".2">${days}</div></div>
      <div class="chip coral-chip rv" data-at="heart failure" style="margin-top:26px"><span class="d"></span>Heart failure: exercise only partly helps</div>
    </div>
  </div>
  <div class="abs pop" data-at="researchers" data-delay=".5" style="left:160px;top:200px;width:780px">${couchPotatoSVG()}</div>
  <div class="abs" style="left:1010px;top:270px;width:800px">
    <div class="eyebrow rv" data-at="researchers" data-delay=".3">Researchers have a name for it</div>
    <div class="h2 rv" data-at="active couch" style="font-size:108px;line-height:.98;margin-top:18px">Active<br><span class="grad">couch potato</span></div>
    <div class="body rv" data-at="active couch" data-delay=".6" style="margin-top:24px">Works out… but still sits all day.</div>
    <div class="h3 rv" data-at="honestly" style="margin-top:40px">That might be a lot of us.</div>
  </div>`;
};

SCENES[8] = (r, k) => {
  const C = 2 * Math.PI * 190;
  const walk = C * 5 / 30, sit = C * 25 / 30;
  r.innerHTML = `
  <div class="s8-main abs" style="inset:0">
    <div class="abs s8-ring fade" data-at="winner" style="left:160px;top:200px;width:520px;height:520px">
      <svg viewBox="0 0 520 520">
        <circle cx="260" cy="260" r="190" class="trk"/>
        <circle cx="260" cy="260" r="190" class="sg seg-walk" data-at="five minutes" style="stroke-dasharray:${walk - 6} ${C};stroke-dashoffset:${walk}" transform="rotate(-90 260 260)"/>
        <circle cx="260" cy="260" r="190" class="sg seg-sit" data-at="every thirty" style="stroke-dasharray:${sit - 6} ${C};stroke-dashoffset:${sit}" transform="rotate(-30 260 260)"/>
      </svg>
      <div class="s8-ring-in rv" data-at="five minutes"><div class="s8-walker">${ICON.walker}</div><div class="s8-ring-t"><b>5 min</b> walk<br><span class="muted">every 30 min</span></div></div>
      <div class="s8-lab l-walk rv" data-at="five minutes" data-delay=".4">Light walk</div>
      <div class="s8-lab l-sit rv" data-at="every thirty" data-delay=".4">25 min sitting</div>
    </div>
    <div class="abs" style="left:790px;top:150px;width:990px">
      <div class="s8-head"><span class="eyebrow rv" data-at="columbia">Columbia University study</span><span class="chip rv" data-at="eight hours">8 hours of sitting</span></div>
      <div class="card s8-stat rv" data-at="blood sugar" style="margin-top:26px">
        <div class="s8-num"><span class="pct">0</span>%</div>
        <div class="s8-desc"><b>smaller blood sugar spike</b><br><span class="muted">after a big meal</span></div>
        <svg class="s8-chart" viewBox="0 0 300 160">
          <line x1="0" y1="146" x2="300" y2="146" class="cv-base"/>
          <path class="cv cv-a" data-at="blood sugar" d="M0 140 C70 140 85 18 125 18 C165 18 185 130 300 140"/>
          <path class="cv cv-b" data-at="fifty-eight" d="M0 140 C70 140 92 90 128 90 C168 90 190 134 300 140"/>
        </svg>
      </div>
      <div class="card s8-stat rv" data-at="four to five" style="margin-top:20px">
        <div class="s8-num sm">4–5</div><div class="s8-desc"><b>points lower</b><br><span class="muted">blood pressure</span></div>
      </div>
      <div style="margin-top:24px;display:flex;gap:18px">
        <span class="chip pop" data-at="tired"><span class="d"></span>Less tired</span>
        <span class="chip pop" data-at="mood"><span class="d"></span>Better mood</span>
      </div>
      <div class="foot rv" data-at="small study">A small study, but a simple message.</div>
    </div>
  </div>
  <div class="abs" style="inset:0 0 120px 0;display:grid;place-items:center"><div class="s8-move pop" data-at="move often">Move <span class="grad">often.</span></div></div>`;
  const pct = k.q('.pct');
  k.tween(k.T('fifty-eight'), 1.3, p => { pct.textContent = Math.round(58 * p); });
  k.at(k.T('move often'), () => r.classList.add('finale'));
};

SCENES[9] = (r, k) => {
  const tile = (ico, t, s, at) => `<div class="card s9-tile pop" data-at="${at}"><div class="s9-ico">${ico}</div><div class="s9-t">${t}</div><div class="s9-s muted">${s}</div></div>`;
  r.innerHTML = `
  <div class="abs" style="left:160px;top:150px;width:1600px;text-align:center">
    <div class="eyebrow rv" data-at="help desk">On the help desk</div>
    <div class="h2 rv" data-at="help desk" data-delay=".2" style="margin-top:14px">Small moves, <span class="grad">all shift long</span></div>
  </div>
  <div class="abs s9-row" style="left:160px;top:360px;width:1600px">
    ${tile(ICON.headset, 'Stand during calls', 'Headset on, on your feet', 'stand up')}
    ${tile(ICON.lap, 'Lap between tickets', 'Close one, take a quick walk', 'lap')}
    ${tile(ICON.glass(), 'Smaller water glass', 'More refills, more trips', 'water')}
    ${tile(ICON.bell, '30-minute reminder', 'Let a timer nudge you', 'reminder')}
  </div>`;
  const tiles = k.qa('.s9-tile');
  ['stand up', 'lap', 'water', 'reminder'].forEach((p, i) =>
    k.at(k.T(p) + 0.05, () => tiles.forEach((t, j) => t.classList.toggle('lit', j === i))));
  k.at(k.T('reminder') + 1.6, () => tiles.forEach(t => t.classList.add('lit')));
};

SCENES[10] = (r, k) => {
  const boxes = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) =>
    `<div class="s10-day" style="--d:${i * 170}ms"><div class="bx"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><span>${d}</span></div>`).join('');
  r.innerHTML = `
  <div class="abs" style="left:0;right:0;top:140px;text-align:center">
    <div class="eyebrow rv" data-at="challenge">The challenge</div>
    <div class="h3 rv" data-at="one week" style="margin-top:20px;color:#cbd5e1">For one week:</div>
    <div class="s10-big stag" data-at="get up">${W('Up every')} ${W('30 minutes.', 'grad', 2)}</div>
    <div class="rv" data-at="one week" style="margin-top:30px"><div class="s10-week" data-at="even if">${boxes}</div></div>
    <div class="body rv" data-at="even if" data-delay=".4" style="margin-top:16px">Even just a minute counts.</div>
    <div class="chip rv" data-at="next meeting" style="margin-top:24px"><span class="d"></span>Report back at the next meeting</div>
    <div class="s10-thanks rv" data-at="thanks">Thanks, everyone!</div>
  </div>
  <div class="abs s10-src" style="left:200px;right:200px;top:905px"><b>Sources:</b> ${k.data.sources}</div>`;
};
