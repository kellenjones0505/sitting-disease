/* Presentation engine: loads narration + timings, plays scenes back-to-back,
   fires scene animations in sync with the voice, and draws captions. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const stage = $('stage'), scenesEl = $('scenes'), capLine = $('capLine'), captions = $('captions');
  const fill = $('progressFill'), counter = $('counter'), intro = $('intro'), playBtn = $('playBtn');
  const introMeta = $('introMeta'), pauseBtn = $('pauseBtn'), overlay = $('pausedOverlay');
  const params = new URLSearchParams(location.search);

  const PRE = 0.6;   // seconds between a scene appearing and the voice starting
  const GAP = 1.0;   // seconds of breathing room after each scene's audio ends

  let data, timings, audios, offsets, total = 1;
  let cur = null, paused = false, ended = false, started = false;

  /* ---- fit the 1920x1080 stage to the window ---- */
  const fit = () => stage.style.setProperty('--s', Math.min(innerWidth / 1920, innerHeight / 1080));
  addEventListener('resize', fit); fit();

  /* ---- one pausable timer (used for pre-roll and between-scene gaps) ---- */
  let timer = null, timerFn = null, timerDue = 0, timerLeft = 0;
  function schedule(fn, ms) {
    clearTimeout(timer); timerFn = fn; timerDue = performance.now() + ms;
    timer = setTimeout(() => { const f = timerFn; timer = null; timerFn = null; if (f) f(); }, ms);
  }
  function clearTimer() { clearTimeout(timer); timer = null; timerFn = null; }
  function holdTimer() { if (timer) { clearTimeout(timer); timer = null; timerLeft = Math.max(0, timerDue - performance.now()); } }
  function releaseTimer() { if (timerFn && !timer) schedule(timerFn, timerLeft); }

  /* ---- word timing helpers ---- */
  const norm = w => w.toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9'-]/g, '').replace(/^'+|'+$/g, '');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function makeT(words, id) {
    const toks = words.map(w => norm(w.word));
    return (phrase, occ = 1, early = 0.12) => {
      const p = phrase.split(/\s+/).map(norm).filter(Boolean);
      let found = 0;
      for (let i = 0; i < toks.length; i++) {
        if (!toks[i]) continue;
        let j = i, ok = true;
        for (const want of p) {
          while (j < toks.length && !toks[j]) j++;
          if (j >= toks.length || (toks[j] !== want && toks[j].split("'")[0] !== want)) { ok = false; break; }
          j++;
        }
        if (ok && ++found === occ) return Math.max(0, words[i].start - early);
      }
      console.warn(`[cue missing] scene ${id}: "${phrase}"`);
      return 0;
    };
  }

  function makeChunks(words) {
    const chunks = []; let c = [];
    const flush = () => { if (c.length) { chunks.push({ words: c, start: c[0].start, end: c[c.length - 1].end }); c = []; } };
    for (const w of words) {
      if (!/[a-z0-9]/i.test(w.word)) { if (c.length >= 2) flush(); continue; } // standalone "..."
      c.push(w);
      const t = w.word;
      if ((/[.?!]$/.test(t) && c.length >= 4) || (/[,;:]$/.test(t) && c.length >= 9) || c.length >= 13) flush();
    }
    flush();
    return chunks;
  }

  /* ---- scenes ---- */
  function goTo(i) {
    if (!data) return;
    i = Math.max(0, Math.min(data.scenes.length - 1, i));
    clearTimer();
    ended = false; paused = false;
    stage.classList.remove('ended', 'paused');
    captions.classList.remove('hide');
    capLine.innerHTML = '';

    if (cur) {
      cur.audio.onended = null; cur.audio.pause();
      const old = cur.root;
      old.classList.remove('enter'); old.classList.add('leave');
      setTimeout(() => old.remove(), 850);
    }

    const sc = data.scenes[i], words = timings[i].words || [], audio = audios[i];
    audio.pause();
    try { audio.currentTime = 0; } catch (e) { /* not loaded yet */ }

    const root = document.createElement('div');
    root.className = 'scene enter s' + sc.id;
    scenesEl.appendChild(root);

    const T = makeT(words, sc.id);
    const scn = { i, root, audio, cues: [], tweens: [], chunks: makeChunks(words), chunk: -2, spans: [], started: false, capDone: false };
    const k = {
      T, root, data,
      at: (t, fn) => scn.cues.push({ t, fn, done: false }),
      tween: (t, dur, fn) => scn.tweens.push({ t, dur, fn, last: -1 }),
      q: s => root.querySelector(s),
      qa: s => [...root.querySelectorAll(s)],
      isPaused: () => paused,
      alive: () => root.isConnected && cur === scn,
    };
    cur = scn;

    const [a1, a2] = ACCENTS[sc.id] || ['#2dd4bf', '#a78bfa'];
    stage.style.setProperty('--accent', a1);
    stage.style.setProperty('--accent2', a2);
    counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(data.scenes.length).padStart(2, '0')}`;

    try { (SCENES[sc.id] || (() => {}))(root, k); } catch (e) { console.error('scene build error', sc.id, e); }

    const timeOf = (v, occ) => v.startsWith('@') ? parseFloat(v.slice(1)) : T(v, occ);
    root.querySelectorAll('[data-at]').forEach(el => {
      const t = timeOf(el.dataset.at, +(el.dataset.occ || 1)) + +(el.dataset.delay || 0);
      k.at(t, () => el.classList.add(el.dataset.cls || 'in'));
    });
    root.querySelectorAll('[data-gone]').forEach(el => {
      k.at(timeOf(el.dataset.gone, 1), () => el.classList.add('gone'));
    });

    audio.onended = () => {
      scn.capDone = true;
      captions.classList.add('hide');
      if (i === data.scenes.length - 1) schedule(finish, 400);
      else schedule(() => goTo(i + 1), GAP * 1000);
    };
    schedule(() => {
      scn.started = true;
      audio.play().catch(err => { console.warn('play blocked', err); setPaused(true); });
    }, PRE * 1000);
  }

  function finish() {
    ended = true;
    stage.classList.add('ended');
    fill.style.width = '100%';
  }

  /* ---- per-frame: cues, tweens, captions, progress ---- */
  function tick() {
    const s = cur;
    if (s) {
      const t = s.audio.currentTime || 0;
      for (const c of s.cues) if (!c.done && t >= c.t) { c.done = true; try { c.fn(); } catch (e) { console.error(e); } }
      for (const tw of s.tweens) {
        if (t >= tw.t) {
          const p = Math.min(1, (t - tw.t) / tw.dur);
          if (p !== tw.last) { tw.last = p; const e = 1 - Math.pow(1 - p, 3); try { tw.fn(e); } catch (err) { console.error(err); } }
        }
      }
      updateCaptions(s, t);
      if (!ended) fill.style.width = (Math.min(1, (offsets[s.i] + (s.started ? PRE : 0) + t) / total) * 100) + '%';
    }
    requestAnimationFrame(tick);
  }

  function updateCaptions(s, t) {
    if (s.capDone) return;
    let idx = -1;
    for (let j = 0; j < s.chunks.length; j++) { if (s.chunks[j].start - 0.08 <= t) idx = j; else break; }
    if (idx !== s.chunk) {
      s.chunk = idx;
      if (idx < 0) { capLine.innerHTML = ''; s.spans = []; }
      else {
        capLine.innerHTML = s.chunks[idx].words.map(w => `<span class="w">${esc(w.word)}</span>`).join(' ');
        s.spans = [...capLine.children];
        capLine.classList.remove('swap'); void capLine.offsetWidth; capLine.classList.add('swap');
      }
    }
    if (idx >= 0) {
      const ws = s.chunks[idx].words;
      s.spans.forEach((sp, j) => sp.classList.toggle('on', t >= ws[j].start - 0.03));
    }
  }

  /* ---- pause / resume ---- */
  function setPaused(p) {
    if (!cur || !started || ended) return;
    paused = p;
    stage.classList.toggle('paused', p);
    if (p) { holdTimer(); cur.audio.pause(); }
    else if (timerFn) releaseTimer();
    else if (cur.started && !cur.audio.ended) cur.audio.play().catch(() => {});
  }
  function togglePause() {
    if (!started) return;
    if (ended) { goTo(0); return; }
    setPaused(!paused);
  }

  /* ---- start ---- */
  async function start() {
    if (started || playBtn.disabled) return;
    started = true;
    if (!params.has('nofs') && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    // unlock every audio element during the click so later auto-advances are allowed
    await Promise.allSettled(audios.map(a => {
      a.muted = true;
      return a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false; }).catch(() => { a.muted = false; });
    }));
    intro.classList.add('leaving');
    stage.classList.remove('intro');
    const first = Math.max(0, (parseInt(params.get('scene'), 10) || 1) - 1);
    setTimeout(() => { intro.style.display = 'none'; goTo(first); }, 800);
  }

  /* ---- load everything up front ---- */
  async function init() {
    try {
      data = await (await fetch('scenes.json')).json();
      timings = await Promise.all(data.scenes.map(s => fetch(`audio/scene${s.id}.json`).then(r => r.json())));
      audios = data.scenes.map(s => { const a = new Audio(); a.preload = 'auto'; a.src = `audio/scene${s.id}.mp3`; return a; });
      await Promise.all(audios.map(a => new Promise(res => {
        if (a.readyState >= 1) return res();
        a.addEventListener('loadedmetadata', res, { once: true });
        a.addEventListener('error', res, { once: true });
        setTimeout(res, 8000);
      })));
      const durs = audios.map((a, i) => (isFinite(a.duration) && a.duration > 0) ? a.duration
        : ((timings[i].words || []).slice(-1)[0]?.end || 5) + 0.3);
      offsets = []; let acc = 0;
      durs.forEach((d, i) => { offsets.push(acc); acc += PRE + d + (i < durs.length - 1 ? GAP : 0); });
      total = acc;
      const m = Math.floor(total / 60), s = Math.round(total % 60);
      introMeta.textContent = `${data.scenes.length} scenes · ${m}:${String(s).padStart(2, '0')} · click to play`;
      playBtn.disabled = false;
      requestAnimationFrame(tick);
    } catch (e) {
      console.error(e);
      introMeta.textContent = 'Could not load the presentation files';
    }
  }

  /* ---- input ---- */
  playBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', togglePause);
  overlay.addEventListener('click', togglePause);

  let idleT;
  function poke() {
    stage.classList.add('ui-active');
    document.body.classList.remove('hide-cursor');
    clearTimeout(idleT);
    idleT = setTimeout(() => {
      stage.classList.remove('ui-active');
      if (started) document.body.classList.add('hide-cursor');
    }, 2000);
  }
  addEventListener('mousemove', poke);

  addEventListener('keydown', e => {
    if (!started) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); start(); }
      return;
    }
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePause(); }
    else if (e.key === 'ArrowRight') { if (cur && cur.i < data.scenes.length - 1) goTo(cur.i + 1); }
    else if (e.key === 'ArrowLeft') {
      if (!cur) return;
      if (cur.started && cur.audio.currentTime > 3) goTo(cur.i); else goTo(cur.i - 1);
    }
    else if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.();
    }
  });

  window.__pres = { goTo, get cur() { return cur; } };
  init();
})();
