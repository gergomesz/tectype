(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  function fmtAge(ma) {
    if (ma <= 0) return 'Today';
    if (ma >= 1000) return (+(ma / 1000).toFixed(2)) + ' Ga';
    if (ma < 10) return (+ma.toFixed(1)) + ' Ma';
    return Math.round(ma) + ' Ma';
  }
  function fmtSpan(a, b) {
    if (a === b) return fmtAge(a);
    if (a >= 1000 && b >= 1000) return (+(a / 1000).toFixed(2)) + ' – ' + (+(b / 1000).toFixed(2)) + ' Ga';
    return fmtAge(a) + ' – ' + (b <= 0 ? 'today' : fmtAge(b));
  }

  const root = document.documentElement;
  const savedTheme = store.get('tectype-theme', null);
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  $('#theme-btn').addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('tectype-theme', next);
  });

  const heroGlobe = new GT.Globe($('#hero-globe'), { speed: 0.14 });
  const tlGlobe = new GT.Globe($('#tl-globe'), { speed: 0.1 });
  const gameGlobe = new GT.Globe($('#game-globe'), { speed: 0.12 });
  const sceneOf = v => typeof v === 'number' ? GT.sceneForAge(v) : GT.sceneById(v);
  const ageOf = v => typeof v === 'number' ? v : (GT.sceneById(v) || {}).age;

  const demoSeq = [
    ['rodinia', 'Rodinia', 0], ['hadean', 'Hadean', 1], ['cryogenian', 'Cryogenian', 2], ['ordovician', 'Andean-Saharan', 0],
    ['permian', 'Pangea', 1], ['huronian', 'Huronian', 2], ['cambrian', 'Laurentia', 0], ['nuna', 'Nuna', 1], ['carboniferous', 'Alleghenian', 2]
  ];
  const ROUND_NAMES = ['ROUND 1 · TYPE IT', 'ROUND 2 · FIRST LETTER', 'ROUND 3 · FROM MEMORY'];
  let demoI = 0, demoTimer = null;
  function setBars(container, r) { [...container.querySelectorAll('i')].forEach((b, i) => b.classList.toggle('on', i <= r)); }
  function demoStep() {
    const [sid, word, r] = demoSeq[demoI % demoSeq.length]; demoI++;
    const sc = GT.sceneById(sid);
    heroGlobe.setScene(sc, demoI === 1);
    $('#demo-round').textContent = ROUND_NAMES[r];
    setBars($('.demo-round .bars'), r);
    $('#demo-age').textContent = fmtAge(sc.age) + ' · ' + sc.name;
    const w = $('#demo-word'), tick = $('#demo-tick');
    tick.classList.remove('on');
    let n = r === 1 ? 1 : 0;
    w.textContent = word.slice(0, n);
    clearInterval(demoTimer);
    demoTimer = setInterval(() => {
      n++; w.textContent = word.slice(0, n);
      if (n >= word.length) { clearInterval(demoTimer); tick.classList.add('on'); }
    }, 85);
  }
  demoStep();
  setInterval(() => { if (!document.hidden && !$('#view-home').hidden) demoStep(); }, 3800);

  const UNITS = GT.UNITS;
  const EXPANDED = [[4600, 0], [4000, 0.06], [2500, 0.2], [1000, 0.32], [541, 0.44], [251, 0.8], [0, 1]];
  let scaleMode = 'expanded';
  function xOf(t) {
    if (scaleMode === 'true') return (4600 - t) / 4600;
    for (let i = 0; i < EXPANDED.length - 1; i++) {
      const [t0, x0] = EXPANDED[i], [t1, x1] = EXPANDED[i + 1];
      if (t <= t0 && t >= t1) return x0 + (t0 - t) / (t0 - t1) * (x1 - x0);
    }
    return t > 4600 ? 0 : 1;
  }
  function tOf(x) {
    x = Math.max(0, Math.min(1, x));
    if (scaleMode === 'true') return 4600 - x * 4600;
    for (let i = 0; i < EXPANDED.length - 1; i++) {
      const [t0, x0] = EXPANDED[i], [t1, x1] = EXPANDED[i + 1];
      if (x >= x0 && x <= x1) return t0 - (x - x0) / (x1 - x0) * (t0 - t1);
    }
    return 0;
  }
  const pct = v => (v * 100).toFixed(3) + '%';
  let curT = 1100;

  function buildTimeline() {
    const rows = $('#tl-rows'); rows.innerHTML = '';
    const W = rows.clientWidth || 960;
    const addRow = (label, thin) => { const r = el('div', 'tl-row' + (thin ? ' thin' : '')); r.appendChild(el('span', 'tl-row-label', label)); rows.appendChild(r); return r; };
    ['eon', 'era', 'period'].forEach(rank => {
      const r = addRow(rank === 'eon' ? 'Eon' : rank === 'era' ? 'Era' : 'Period');
      UNITS.filter(u => u.rank === rank).forEach(u => {
        const a = xOf(u.start), b = xOf(u.end);
        const s = el('div', 'tl-seg' + (u.beyond ? ' beyond' : ''));
        s.dataset.unit = u.id;
        s.style.left = pct(a); s.style.width = pct(b - a);
        s.style.background = u.color; s.style.color = u.fg;
        const px = (b - a) * W;
        s.textContent = px > u.name.length * 7 + 10 ? u.name : (u.abbr && px > u.abbr.length * 7 + 8 ? u.abbr : '');
        s.title = u.name + ' · ' + fmtSpan(u.start, u.end);
        r.appendChild(s);
      });
    });
    [['supercontinent', 'Supercont.'], ['glaciation', 'Ice ages']].forEach(([cat, label]) => {
      const r = addRow(label, true);
      GT.EVENTS.filter(e => e.cat === cat).forEach(e => {
        const a = xOf(e.start), b = xOf(e.end);
        const bar = el('div', 'tl-bar'); bar.style.left = pct(a); bar.style.width = 'max(4px,' + pct(b - a) + ')';
        bar.style.background = GT.CATS[cat].color; bar.title = e.name + ' · ' + fmtSpan(e.start, e.end);
        r.appendChild(bar);
      });
      const evs = GT.EVENTS.filter(e => e.cat === cat).sort((p, q) => q.start - p.start);
      evs.forEach((e, i) => {
        const short = e.name.replace(' glaciation', '').replace(' (Snowball Earth)', '').replace(' / Kenorland', '').replace(' / Columbia', '').replace(' & Gondwana', '');
        const endPx = xOf(e.end) * W + 6;
        const nextPx = i + 1 < evs.length ? xOf(evs[i + 1].start) * W - 4 : W;
        const need = short.length * 6.4;
        const lab = el('span', 'tl-bar-label', esc(short));
        if (nextPx - endPx >= need) lab.style.left = endPx + 'px';
        else if ((xOf(e.end) - xOf(e.start)) * W >= need + 10) { lab.style.left = (xOf(e.start) * W + 5) + 'px'; lab.classList.add('in'); }
        else return;
        r.appendChild(lab);
      });
    });
    const r = addRow('Events', true);
    GT.EVENTS.filter(e => e.cat !== 'supercontinent' && e.cat !== 'glaciation').forEach(e => {
      const d = el('div', 'tl-tick'); d.style.left = pct(xOf(e.start)); d.style.background = GT.CATS[e.cat].color; d.title = e.name + ' · ' + fmtSpan(e.start, e.end);
      r.appendChild(d);
    });
    const axis = el('div', 'tl-axis');
    const ticks = scaleMode === 'true' ? [4500, 4000, 3500, 3000, 2500, 2000, 1500, 1000, 500, 0] : [4600, 4000, 3500, 3000, 2500, 2000, 1500, 1000, 800, 541, 443, 358, 251, 145, 66, 0];
    ticks.forEach(t => { const s = el('span', null, fmtAge(t)); s.style.left = pct(xOf(t)); axis.appendChild(s); });
    rows.appendChild(axis);
    setT(curT, false);
  }

  function unitAt(rank, t) { return UNITS.find(u => u.rank === rank && t <= u.start && (t > u.end || (u.end === 0 && t >= 0))); }

  function setT(t, scroll) {
    curT = Math.max(0, Math.min(4600, t));
    const x = xOf(curT);
    const rows = $('#tl-rows');
    const cur = $('#tl-cursor');
    cur.style.left = (rows.offsetLeft + x * rows.clientWidth) + 'px';
    $('#tl-cursor-label').textContent = fmtAge(curT);
    const tl = $('#tl'); tl.setAttribute('aria-valuenow', Math.round(curT)); tl.setAttribute('aria-valuetext', fmtAge(curT));
    if (scroll) {
      const sc = $('#tl-scroll'); const px = rows.offsetLeft + x * rows.clientWidth;
      if (px < sc.scrollLeft + 40 || px > sc.scrollLeft + sc.clientWidth - 40) sc.scrollLeft = px - sc.clientWidth / 2;
    }
    renderDetail();
  }

  function renderDetail() {
    const t = curT;
    const eon = unitAt('eon', t), era = unitAt('era', t), per = unitAt('period', t);
    const f = per || era || eon;
    document.querySelectorAll('.tl-seg').forEach(s => s.classList.toggle('active', [eon, era, per].some(u => u && u.id === s.dataset.unit)));
    const crumbs = $('#tl-crumbs'); crumbs.innerHTML = '';
    [eon, era, per].filter(Boolean).forEach(u => {
      const b = el('button', 'crumb', esc(u.rank.toUpperCase() + ' · ' + u.name));
      b.type = 'button'; b.style.background = u.color; b.style.color = u.fg;
      b.addEventListener('click', () => setT((u.start + u.end) / 2, true));
      crumbs.appendChild(b);
    });
    let name = f.name, span = fmtSpan(f.start, f.end) + ' · ' + fmtDur(f.start - f.end);
    if (f.sub) { const s = f.sub.find(s => t <= s.start && t > s.end); if (s) span += ' · ' + s.name + ' (' + fmtSpan(s.start, s.end) + ')'; }
    $('#tl-name').textContent = name;
    $('#tl-span').textContent = span;
    const sc = GT.sceneForAge(t);
    tlGlobe.setScene(sc);
    $('#tl-scene-name').textContent = sc.name;
    $('#tl-look').textContent = sc.desc;
    $('#tl-blurb').textContent = f.blurb;
    document.querySelectorAll('#tl-jump button').forEach(b => b.classList.toggle('on', b.dataset.scene === sc.id));
    const range = f.start - f.end;
    const evs = GT.EVENTS.filter(e => e.start >= f.end && e.end <= f.start).sort((a, b) => b.start - a.start);
    const list = $('#tl-events'); list.innerHTML = '';
    if (!evs.length) list.appendChild(el('li', 'ev', '<div></div><div><p>No events from the lectures fall in this span.</p></div>'));
    evs.forEach(e => {
      const now = t <= e.start + range * 0.02 && t >= e.end - range * 0.02;
      const c = GT.CATS[e.cat];
      const li = el('li', 'ev' + (now ? ' now' : ''));
      li.innerHTML = `<div class="ev-cat"><i style="background:${c.color}"></i><span>${c.label}<span class="ev-date">${fmtSpan(e.start, e.end)}</span></span></div>
        <div><b>${esc(e.name)}</b><p>${esc(e.text)}</p>${e.evidence ? `<p class="how">${esc(e.evidence)}</p>` : ''}</div>`;
      list.appendChild(li);
    });
  }
  function fmtDur(my) { return my >= 1000 ? (+(my / 1000).toFixed(2)) + ' billion years' : (+my.toFixed(1)) + ' million years'; }

  GT.SCENES.forEach(s => {
    const b = el('button', null, esc(s.name)); b.type = 'button'; b.dataset.scene = s.id;
    b.addEventListener('click', () => setT(s.age === 0 ? 0 : s.age, true));
    $('#tl-jump').appendChild(b);
  });
  (function () {
    const tl = $('#tl'); let down = false;
    const fromEvent = e => { const r = $('#tl-rows').getBoundingClientRect(); setT(tOf((e.clientX - r.left) / r.width), false); };
    tl.addEventListener('pointerdown', e => { if (e.button !== 0) return; down = true; tl.setPointerCapture(e.pointerId); fromEvent(e); });
    tl.addEventListener('pointermove', e => { if (down) fromEvent(e); });
    const up = () => { down = false; };
    tl.addEventListener('pointerup', up); tl.addEventListener('pointercancel', up);
    tl.addEventListener('keydown', e => {
      const step = e.shiftKey ? 0.05 : 0.01;
      if (e.key === 'ArrowLeft') { setT(tOf(xOf(curT) - step), true); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { setT(tOf(xOf(curT) + step), true); e.preventDefault(); }
      else if (e.key === 'Home') { setT(4600, true); e.preventDefault(); }
      else if (e.key === 'End') { setT(0, true); e.preventDefault(); }
    });
  })();
  function setScale(mode) {
    scaleMode = mode;
    $('#scale-expanded').classList.toggle('on', mode === 'expanded'); $('#scale-expanded').setAttribute('aria-pressed', mode === 'expanded');
    $('#scale-true').classList.toggle('on', mode === 'true'); $('#scale-true').setAttribute('aria-pressed', mode === 'true');
    buildTimeline();
  }
  $('#scale-expanded').addEventListener('click', () => setScale('expanded'));
  $('#scale-true').addEventListener('click', () => setScale('true'));
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(buildTimeline, 150); });

  function gotoTime(t) {
    if (location.hash !== '#timeline') location.hash = 'timeline'; else $('#timeline').scrollIntoView();
    requestAnimationFrame(() => setT(t, true));
  }

  const CAUSES = [
    { id: 'oxygen', name: 'More oxygen', short: 'O₂ destroys methane', text: 'Oxygen from photosynthesising bacteria reacts with methane (CH₄), a far stronger greenhouse gas, and replaces it with weaker CO₂.' },
    { id: 'organisms', name: 'Life uses up greenhouse gases', short: 'Less CH₄ and CO₂', text: 'Bacteria remove methane; photosynthesis by cyanobacteria and later land plants pulls CO₂ out of the air. Buried plants (coal) lock it away.' },
    { id: 'weathering', name: 'More weathering', short: 'Rifting exposes fresh rock', text: 'Break-up brings volcanism and fresh rock. Weathering that rock with CO₂-bearing rain removes CO₂ from the atmosphere.' },
    { id: 'carbonate', name: 'Carbonate carbon sink', short: 'CaCO₃ stores CO₂', text: 'Carbonate production in the oceans locks carbon into limestone, a long-term carbon sink.' },
    { id: 'volcanism', name: 'Less volcanic outgassing', short: 'Fewer ridges and arcs', text: 'With less mid-ocean ridge and arc activity, volcanoes add less CO₂, so the greenhouse weakens. A general cause from the lecture list.' },
    { id: 'polar', name: 'Continents at the poles', short: 'Land for ice sheets', text: 'Ice sheets grow on land. When a big continent sits over a pole (Rodinia, then Gondwana twice), ice can pile up.' },
    { id: 'albedo', name: 'Albedo feedback', short: 'Ice reflects sunlight', text: 'Once snow and ice build up, more sunlight is reflected, so the planet cools faster: a positive feedback loop.' }
  ];
  const GLACS = [
    { id: 'pongola', name: 'Pongola', when: '~2.9 Ga', t: 2920, causes: ['albedo'],
      text: 'The oldest known glaciation, in South Africa during the Mesoarchean. It is not in the lectures and its causes are still debated; small continents and a weaker young Sun may have helped.',
      evidence: ['Glacial diamictites', 'Striated clasts'] },
    { id: 'huronian', name: 'Huronian', when: '2.45 – 2.2 Ga', t: 2300, causes: ['oxygen', 'organisms', 'albedo'],
      text: 'The first big ice age, in the Paleoproterozoic, as the Great Oxidation Event began. Bacteria removed methane from the atmosphere and produced more oxygen. The Superia supercraton was breaking up.',
      evidence: ['Diamictite (Gowganda Fm.)', 'Varves', 'Dropstones', 'Huronian Supergroup, Sudbury–Elliot Lake'] },
    { id: 'cryogenian', name: 'Cryogenian', when: '~800 – 600 Ma', t: 700, causes: ['weathering', 'carbonate', 'polar', 'albedo'],
      text: 'Snowball Earth. Rodinia broke up: volcanism exposed fresh rock, weathering increased, the carbon sink grew and CO₂ fell. Parts of Rodinia were still near the South Pole, and albedo did the rest. Sea level fell.',
      evidence: ['Glacial diamictites at low latitudes', 'Sturtian glaciation deposits', 'Great Unconformity (erosion)'] },
    { id: 'marinoan', name: 'Marinoan', when: '~650 – 635 Ma', t: 642, causes: ['weathering', 'carbonate', 'albedo'],
      text: 'The second Cryogenian Snowball Earth, after the Sturtian. Not named in the lectures, but part of the same 800–600 Ma glacial interval. Its end opens the Ediacaran.',
      evidence: ['Low-latitude diamictites', 'Cap carbonates on top of the tills'] },
    { id: 'gaskiers', name: 'Gaskiers', when: '~580 Ma', t: 581, causes: ['albedo'],
      text: 'A short, regional Ediacaran glaciation in Newfoundland. Soon afterwards the Ediacara fauna appear at Mistaken Point. Beyond the lectures.',
      evidence: ['Glacial deposits in Newfoundland'] },
    { id: 'andean', name: 'Andean-Saharan', when: '460 – 430 Ma', t: 448, causes: ['organisms', 'polar', 'albedo'],
      text: 'Late Ordovician–Silurian. Gondwana (North Africa) sat over the South Pole. Less CO₂ from more photosynthesis and the first land plants. Sea level fell (regression), and the cold coincides with the first of the Big Five mass extinctions.',
      evidence: ['Glacial striations in the Sahara', 'Heavier oxygen isotopes in marine sediments', 'Regression unconformities'] },
    { id: 'karoo', name: 'Carboniferous–Permian', when: '~340 – 270 Ma', t: 310, causes: ['organisms', 'polar', 'albedo'],
      text: 'Gondwana, now part of Pangea, sat over the South Pole. Forests spread and coal swamps buried plant carbon. The ice lasted until about 270 Ma, then the climate warmed.',
      evidence: ['Glacial tillites on southern continents', 'Coal at the equator, tillites in the south'] },
    { id: 'quaternary', name: 'Quaternary', when: '2.6 Ma – today', t: 1, causes: ['weathering', 'polar', 'albedo'],
      text: 'The ice age we live in. Antarctica sits over the South Pole, and uplift of mountains such as the Himalaya increases weathering. Ice sheets advance and retreat in cycles. Beyond the lectures.',
      evidence: ['Moraines and drumlins', 'Glacial erratics', 'Striated bedrock across Ontario'] }
  ];
  let iceSel = { type: 'glac', id: 'cryogenian' };
  CAUSES.forEach(c => {
    const li = el('li'); const b = el('button', 'cause', `<b>${esc(c.name)}</b><span>${esc(c.short)}</span>`);
    b.type = 'button'; b.dataset.cause = c.id;
    b.addEventListener('click', () => { iceSel = { type: 'cause', id: c.id }; renderIce(); });
    li.appendChild(b); $('#causes').appendChild(li);
  });
  GLACS.forEach(g => {
    const b = el('button', 'glac', `<b>${esc(g.name)}</b><span>${esc(g.when)}</span>`);
    b.type = 'button'; b.dataset.glac = g.id;
    b.addEventListener('click', () => { iceSel = { type: 'glac', id: g.id }; renderIce(); });
    $('#glaciations').appendChild(b);
  });
  function renderIce() {
    const d = $('#glac-detail');
    if (iceSel.type === 'glac') {
      const g = GLACS.find(x => x.id === iceSel.id);
      document.querySelectorAll('.glac').forEach(b => { b.classList.toggle('on', b.dataset.glac === g.id); b.classList.remove('dim'); });
      document.querySelectorAll('.cause').forEach(b => { const has = g.causes.includes(b.dataset.cause); b.classList.toggle('on', has); b.classList.toggle('dim', !has); });
      d.innerHTML = `<h3>${esc(g.name)} glaciation · <span class="accent">${esc(g.when)}</span></h3><p>${esc(g.text)}</p>
        <p><b>Causes:</b> ${g.causes.map(id => esc(CAUSES.find(c => c.id === id).name)).join(' · ')}</p>
        <div class="tags">${g.evidence.map(e => `<span class="tag">${esc(e)}</span>`).join('')}</div>
        <div class="g-actions"><button type="button" class="btn btn-ghost btn-sm" id="ice-goto">See it on the timeline</button></div>`;
      $('#ice-goto').addEventListener('click', () => gotoTime(g.t));
    } else {
      const c = CAUSES.find(x => x.id === iceSel.id);
      const gs = GLACS.filter(g => g.causes.includes(c.id));
      document.querySelectorAll('.cause').forEach(b => { b.classList.toggle('on', b.dataset.cause === c.id); b.classList.remove('dim'); });
      document.querySelectorAll('.glac').forEach(b => { const has = gs.some(g => g.id === b.dataset.glac); b.classList.toggle('on', has); b.classList.toggle('dim', !has); });
      d.innerHTML = `<h3>${esc(c.name)}</h3><p>${esc(c.text)}</p><p><b>Linked in the lectures to:</b> ${gs.length ? gs.map(g => esc(g.name)).join(' · ') : 'long-term cooling in general'}</p>`;
    }
  }
  renderIce();

  const SC_TXT = {
    ur: 'First small continent, smaller than Australia.', superia: 'Supercraton with Ontario’s Superior Province. Break-up during Huronian ice.',
    nuna: 'Also Columbia or Nena. Sudbury impact hits its margin.', rodinia: 'Grenville Orogeny. Rifts ~750 Ma before Snowball Earth.',
    pannotia: 'Brief assembly ~600 Ma as Gondwana forms.', pangea: 'Alleghenian/Variscan + Ural collisions. Complete in the Permian.'
  };
  GT.EVENTS.filter(e => e.cat === 'supercontinent').forEach(e => {
    const b = el('button', 'sc', `<b>${esc(e.name.split(' ')[0])}</b><span class="age">${fmtSpan(e.start, e.end)}</span><span class="txt">${esc(SC_TXT[e.id] || '')}</span>`);
    b.type = 'button';
    b.addEventListener('click', () => gotoTime(e.id === 'pangea' ? 260 : (e.start + e.end) / 2));
    $('#sc-row').appendChild(b);
  });

  const PERIOD_SPANS = UNITS.filter(u => u.rank === 'period' && u.start <= 1000);
  function strip(start, end) {
    const lo = 600, x = t => Math.max(0, Math.min(1, (lo - t) / lo)) * 100;
    let h = '<div class="strip">';
    PERIOD_SPANS.forEach(u => { if (u.end < lo) h += `<i style="left:${x(u.start)}%;width:${x(u.end) - x(u.start)}%;background:${u.color}"></i>`; });
    h += `<span class="bar" style="left:${x(start)}%;width:max(4px,${x(end) - x(start)}%)"></span></div>`;
    return h + `<div class="strip-axis"><span style="left:0">600 Ma</span><span style="left:${x(251)}%">251</span><span style="right:0">now</span></div>`;
  }
  function span(fo) { return fo.from === fo.to ? fo.from + ' only' : fo.from + ' → ' + fo.to; }
  GT.FOSSILS.forEach(fo => {
    const card = el('article', 'fossil');
    card.innerHTML = `<div class="fossil-art">${GT.fossilSVG(fo.id, fo.name + ' drawing')}</div>
      <span class="grp">${esc(fo.group)}</span><b>${esc(fo.name)}</b>
      <span class="rng">${esc(span(fo))}${fo.start > 600 ? ' · from ' + fmtAge(fo.start) : ''}</span>
      ${strip(fo.start, fo.end)}
      <p><b>Look for:</b> ${esc(fo.look)}</p><p>${esc(fo.note)}</p>`;
    $('#fossil-grid').appendChild(card);
  });

  const ISOS = [
    { p: 'Uranium-238', d: 'Lead-206', hl: 4500, hlTxt: '4.5 Ga', range: '10 Ma – 4.6 Ga', min: 'Zircon, uraninite' },
    { p: 'Uranium-235', d: 'Lead-207', hl: 710, hlTxt: '710 Ma', range: '10 Ma – 4.6 Ga', min: 'Zircon, uraninite' },
    { p: 'Potassium-40', d: 'Argon-40', hl: 1300, hlTxt: '1.3 Ga', range: '100,000 a – 4.6 Ga', min: 'Micas, hornblende' },
    { p: 'Rubidium-87', d: 'Strontium-87', hl: 47000, hlTxt: '47 Ga', range: '10 Ma – 4.6 Ga', min: 'Micas, K-feldspar, biotite, glauconite' },
    { p: 'Carbon-14', d: 'Nitrogen-14', hl: 0.00573, hlTxt: '5730 a', range: '100 – 50,000 a', min: 'Biological material, CO₂' }
  ];
  const isoSel = $('#iso-select'), hlRange = $('#hl-range');
  ISOS.forEach((iso, i) => {
    isoSel.appendChild(Object.assign(document.createElement('option'), { value: i, textContent: iso.p }));
    const tr = el('tr', null, `<td>${iso.p}</td><td>${iso.d}</td><td>${iso.hlTxt}</td><td>${iso.range}</td><td>${iso.min}</td>`);
    tr.dataset.i = i;
    $('#iso-body').appendChild(tr);
  });
  for (let i = 0; i < 64; i++) $('#atoms').appendChild(el('span'));
  const order = [...Array(64).keys()].sort(() => Math.random() - 0.5);
  function fmtYears(my) {
    if (my >= 1000) return (+(my / 1000).toFixed(2)) + ' billion years';
    if (my >= 1) return (+my.toFixed(1)) + ' million years';
    return Math.round(my * 1e6).toLocaleString('en-CA') + ' years';
  }
  function renderDecay() {
    const n = +hlRange.value, iso = ISOS[+isoSel.value];
    const left = 64 / Math.pow(2, n);
    const keep = new Set(order.slice(0, Math.round(left)));
    [...$('#atoms').children].forEach((a, i) => a.classList.toggle('p', keep.has(i)));
    $('#hl-n').textContent = n;
    const frac = n === 0 ? 'all' : '1/' + Math.pow(2, n);
    $('#decay-out').innerHTML = `After <b>${n}</b> half-li${n === 1 ? 'fe' : 'ves'} (${fmtYears(iso.hl * n)}), <b>${frac}</b> of the ${esc(iso.p)} is left and the rest is ${esc(iso.d)}.${n === 5 ? ' Past about 5 half-lives too little parent is left to measure well.' : ''}`;
    document.querySelectorAll('#iso-body tr').forEach(tr => tr.classList.toggle('on', +tr.dataset.i === +isoSel.value));
  }
  isoSel.addEventListener('change', renderDecay);
  hlRange.addEventListener('input', renderDecay);
  renderDecay();

  const LEVELS = GT.LEVELS;
  $('#pill-text').textContent = 'Hadean → Permian · ' + LEVELS.length + ' levels';
  function progress() {
    const p = store.get('tectype-progress', {});
    Object.keys(p).forEach(k => { if (typeof p[k] === 'number') p[k] = { stars: p[k], acc: 0, score: 0 }; });
    return p;
  }
  const runs = () => store.get('tectype-runs', []);
  const TOTAL = LEVELS.reduce((a, l) => a + l.items.length, 0);
  function overallPct() {
    const p = progress();
    return Math.round(LEVELS.reduce((a, l) => a + (p[l.id] ? p[l.id].acc * l.items.length : 0), 0) / TOTAL * 100);
  }
  function setRing(circle, pct) { circle.style.strokeDashoffset = (94.25 * (1 - pct / 100)).toFixed(2); }
  function updateOverall() {
    const pct = overallPct();
    $('#overall-pct').textContent = pct + '%';
    setRing($('#overall-ring'), pct);
    $('#overall').setAttribute('aria-label', 'Overall mastery ' + pct + '%. See your scores');
    return pct;
  }
  const fmtTime = secs => Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
  const starsHTML = n => [0, 1, 2].map(i => `<span class="${i < n ? 'on' : ''}">★</span>`).join('');
  function renderLevels() {
    const p = progress();
    const box = $('#levels'); box.innerHTML = '';
    LEVELS.forEach((lv, i) => {
      const b = el('button', 'level');
      b.type = 'button';
      const r = p[lv.id] || { stars: 0, acc: 0 };
      b.innerHTML = `<span class="lv-n">LEVEL ${i + 1}</span><b>${esc(lv.title)}</b><span class="lv-s">${esc(lv.sub)}</span>
        <span class="lv-f"><span>${lv.items.length} names${p[lv.id] ? ` · <span class="lv-best">${Math.round(r.acc * 100)}% best</span>` : ''}</span><span class="lv-stars" aria-label="${r.stars} of 3 stars">${starsHTML(r.stars)}</span></span>`;
      b.addEventListener('click', () => { location.hash = 'level-' + lv.id; });
      box.appendChild(b);
    });
    const pct = updateOverall();
    const played = LEVELS.filter(l => p[l.id]).length;
    $('#play-overall').innerHTML = `<div class="po-row"><span>Overall mastery</span><b>${pct}%</b></div><div class="po-bar"><i style="width:${pct}%"></i></div><div class="po-row"><span>${played} of ${LEVELS.length} levels played</span><span>${LEVELS.reduce((a, l) => a + (p[l.id] ? p[l.id].stars : 0), 0)} / ${LEVELS.length * 3} ★</span></div>`;
    const it = todayItem();
    $('#today-card').innerHTML = `<svg aria-hidden="true"><use href="#logo-earth"/></svg><span><span class="t-k">Event of the day</span><span class="t-n">${esc(it.item[1])}</span><span class="t-c">Three quick rounds on one name</span></span><span class="t-go">Play →</span>`;
  }
  const ALL = []; LEVELS.forEach(lv => lv.items.forEach(item => ALL.push({ item, level: lv })));
  function todayItem() {
    const d = new Date(); const day = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
    let step = 37; const gcd = (a, b) => b ? gcd(b, a % b) : a; if (gcd(step, ALL.length) !== 1) step = 1;
    return ALL[(day * step) % ALL.length];
  }

  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const ROUND_SUB = [
    'The name is on screen. Type over it to learn the spelling.',
    'Only the first letter and a clue. Recall the rest.',
    'No letters and no caption on the globe. Just the clue.'
  ];
  const G = { level: null, round: 0, queue: [], cur: null, solved: false, revealed: false, firstTry: [0, 0, 0], tried: null, missed: new Set(), t0: 0, timer: null };
  const input = $('#g-input');

  function screen(id) { ['g-intro', 'g-round', 'g-between', 'g-done'].forEach(s => { $('#' + s).hidden = s !== id; }); }

  function startLevel(lv) {
    G.level = lv;
    show('game');
    const idx = LEVELS.indexOf(lv);
    $('#game-level').textContent = lv.id === 'today' ? 'Event of the day' : 'Level ' + (idx + 1) + ' · ' + lv.title;
    $('#g-intro-eyebrow').textContent = lv.id === 'today' ? 'Event of the day · ' + new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric' }) : 'Level ' + (idx + 1) + ' of ' + LEVELS.length;
    $('#g-intro-title').textContent = lv.id === 'today' ? lv.items[0][0] : lv.title;
    $('#g-intro-sub').textContent = lv.id === 'today' ? lv.items[0][1] + '. ' + lv.items[0][2] : lv.sub + '. You will see each name three times.';
    const ul = $('#g-intro-list'); ul.innerHTML = '';
    if (lv.id === 'today') ul.appendChild(el('li', null, 'From: ' + esc(lv.from)));
    else lv.items.forEach(it => ul.appendChild(el('li', null, esc(it[0]))));
    const first = lv.items[0];
    showArt(first, true);
    $('#game-caption').innerHTML = '';
    screen('g-intro');
    setTimeout(() => $('#g-start').focus({ preventScroll: true }), 30);
  }
  function beginRounds() {
    G.round = 0; G.firstTry = [0, 0, 0]; G.missed = new Set(); G.t0 = performance.now();
    startRound();
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function startRound() {
    const n = G.level.items.length;
    G.queue = G.round === 0 ? [...Array(n).keys()] : shuffle([...Array(n).keys()]);
    G.order = G.queue.slice();
    G.status = Array(n).fill('');
    G.tried = new Set();
    $('#g-round-name').textContent = ROUND_NAMES[G.round];
    setBars($('#g-bars'), G.round);
    screen('g-round');
    nextItem();
  }
  function renderProgress() {
    const p = $('#g-progress'); p.innerHTML = '';
    G.order.forEach(i => { const b = el('i', G.status[i] || (i === G.cur ? 'cur' : '')); p.appendChild(b); });
  }
  function nextItem() {
    clearTimeout(G.timer);
    if (!G.queue.length) { endRound(); return; }
    G.cur = G.queue.shift();
    G.solved = false; G.revealed = false;
    const it = G.level.items[G.cur];
    input.value = '';
    $('#g-fact').hidden = true;
    $('#g-next').hidden = true; $('#g-reveal').hidden = false;
    $('#g-typebox').classList.remove('ok');
    const hint = $('#g-hint'); hint.classList.remove('bad');
    hint.textContent = G.round === 0 ? 'Type over the name.' : 'Type the name. Press Enter if you don’t know it.';
    $('#g-clue').textContent = it[1];
    const sc = showArt(it);
    const age = ageOf(it[3]);
    const fo = it[5] && GT.FOSSILS.find(x => x.id === it[5]);
    if (fo) {
      const sight = norm(fo.name) === norm(it[0]);
      $('#game-caption').innerHTML = !sight ? `<b>${esc(fo.name)}</b>` : G.round === 0 ? `<b>${esc(fo.name)}</b>${esc(fo.group)}` : G.round === 1 ? esc(fo.group) : '';
    } else {
      $('#game-caption').innerHTML = G.round === 0 ? `<b>${esc(sc.name)}</b>${fmtAge(age)}` : (G.round === 1 ? fmtAge(age) : '');
    }
    renderProgress();
    renderDisplay();
    focusInput();
  }
  function showArt(it, instant) {
    const frame = $('#game-fossil'), canvas = $('#game-globe');
    if (it[5]) {
      const fo = GT.FOSSILS.find(x => x.id === it[5]);
      frame.innerHTML = GT.fossilSVG(it[5], 'Fossil drawing');
      frame.dataset.fossil = it[5];
      frame.hidden = false; canvas.hidden = true;
      return GT.sceneForAge(fo.start);
    }
    frame.hidden = true; canvas.hidden = false;
    gameGlobe.resize();
    const sc = sceneOf(it[3]);
    gameGlobe.setScene(sc, instant);
    return sc;
  }
  function focusInput() { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } }
  function same(a, b) { a = a.toLowerCase(); b = b.toLowerCase(); return a === b || (/[\s\-–]/.test(a) && /[\s\-–]/.test(b)); }
  function renderDisplay() {
    const it = G.level.items[G.cur], target = it[0], typed = input.value;
    const d = $('#g-display');
    let h = '';
    if (G.solved || G.revealed) {
      h = `<span class="${G.solved ? 'ok' : 'x'}">${esc(target)}</span>` + (G.solved ? '<span class="tick">✓</span>' : '');
    } else if (G.round === 0) {
      for (let i = 0; i < Math.max(target.length, typed.length); i++) {
        if (i === typed.length) h += '<span class="caret"></span>';
        if (i < typed.length) {
          const ch = i < target.length ? target[i] : typed[i];
          h += `<span class="${i < target.length && same(typed[i], target[i]) ? 'c' : 'x'}">${esc(ch === ' ' ? ' ' : ch)}</span>`;
        } else h += `<span class="g">${esc(target[i] === ' ' ? ' ' : target[i])}</span>`;
      }
      if (typed.length >= target.length) h += '<span class="caret"></span>';
    } else if (G.round === 1) {
      if (!typed.length) h += `<span class="caret"></span><span class="first">${esc(target[0])}</span>`;
      for (let i = 0; i < typed.length; i++) {
        h += `<span class="${i < target.length && same(typed[i], target[i]) ? 'c' : 'x'}">${esc(typed[i] === ' ' ? ' ' : typed[i])}</span>`;
      }
      if (typed.length) h += '<span class="caret"></span>';
      for (let i = Math.max(1, typed.length); i < target.length; i++) h += `<span class="g u">${target[i] === ' ' ? ' ' : '_'}</span>`;
    } else {
      h = `<span class="typed">${esc(typed).replace(/ /g, ' ')}</span><span class="caret"></span>`;
    }
    d.innerHTML = h;
  }
  function isMatch(typed, it) { const t = norm(typed); if (!t) return false; return [it[0], ...(it[4] || [])].some(a => norm(a) === t); }
  function onInput() {
    if (G.solved || G.revealed) return;
    const it = G.level.items[G.cur];
    if (isMatch(input.value, it)) return success();
    renderDisplay();
  }
  function success() {
    const it = G.level.items[G.cur];
    G.solved = true;
    if (!G.tried.has(G.cur)) G.firstTry[G.round]++;
    G.status[G.cur] = G.tried.has(G.cur) ? 'miss' : 'done';
    $('#g-typebox').classList.add('ok');
    renderDisplay(); renderProgress();
    $('#g-reveal').hidden = true;
    if (G.round === 0) {
      showFact(it);
      $('#g-next').hidden = false;
      $('#g-hint').textContent = 'Press Enter to continue.';
    } else {
      $('#g-hint').textContent = 'Correct.';
      G.timer = setTimeout(nextItem, 850);
    }
  }
  function showFact(it) {
    const f = $('#g-fact'); f.hidden = false;
    const fo = it[5] && GT.FOSSILS.find(x => x.id === it[5]);
    f.innerHTML = `<b>${esc(fo ? fo.name : it[0])} · ${fo ? esc(span(fo)) : fmtAge(ageOf(it[3]))}</b>${esc(it[2])}`;
  }
  function reveal() {
    if (G.solved || G.revealed) return;
    const it = G.level.items[G.cur];
    G.revealed = true; G.tried.add(G.cur); G.missed.add(it[0]);
    G.status[G.cur] = 'miss';
    G.queue.push(G.cur);
    renderDisplay(); renderProgress();
    const box = $('#g-typebox'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    const hint = $('#g-hint'); hint.classList.add('bad'); hint.textContent = 'It comes back at the end of this round. Press Enter to continue.';
    showFact(it);
    $('#g-reveal').hidden = true; $('#g-next').hidden = false;
  }
  input.addEventListener('input', onInput);
  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (G.solved || G.revealed) { nextItem(); return; }
    if (isMatch(input.value, G.level.items[G.cur])) { success(); return; }
    reveal();
  });
  $('#g-typebox').addEventListener('click', focusInput);
  $('#g-reveal').addEventListener('click', () => { reveal(); focusInput(); });
  $('#g-next').addEventListener('click', () => { nextItem(); });
  $('#g-start').addEventListener('click', beginRounds);

  function endRound() {
    if (G.round < 2) {
      G.round++;
      $('#g-between-eyebrow').textContent = 'Round ' + G.round + ' done · ' + G.firstTry[G.round - 1] + '/' + G.level.items.length + ' first try';
      $('#g-between-title').textContent = ROUND_NAMES[G.round].replace(' · ', ' · ').toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase());
      $('#g-between-sub').textContent = ROUND_SUB[G.round];
      $('#game-caption').innerHTML = '';
      screen('g-between');
      setTimeout(() => $('#g-continue').focus({ preventScroll: true }), 30);
    } else finishLevel();
  }
  $('#g-continue').addEventListener('click', startRound);

  function finishLevel() {
    const n = G.level.items.length;
    const acc = G.firstTry[2] / n;
    const stars = acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : 1;
    const secs = Math.round((performance.now() - G.t0) / 1000);
    const score = G.firstTry[0] * 5 + G.firstTry[1] * 10 + G.firstTry[2] * 20 + Math.max(0, n * 25 - secs) * 2;
    const all = runs();
    const prevBest = all.filter(r => r.level === G.level.id).reduce((a, r) => Math.max(a, r.score), 0);
    all.push({ level: G.level.id, title: G.level.id === 'today' ? 'Event of the day · ' + G.level.items[0][0] : G.level.title, score, acc, secs, date: Date.now() });
    all.sort((a, b) => b.score - a.score);
    store.set('tectype-runs', all.slice(0, 200));
    const rank = all.findIndex(r => r.score === score) + 1;
    if (G.level.id !== 'today') {
      const p = progress(), o = p[G.level.id] || { stars: 0, acc: 0, score: 0 };
      p[G.level.id] = { stars: Math.max(o.stars, stars), acc: Math.max(o.acc, acc), score: Math.max(o.score, score) };
      store.set('tectype-progress', p);
    }
    const pct = updateOverall();
    $('#g-score').innerHTML = `Score <b>${score.toLocaleString('en-CA')}</b>${score > prevBest && prevBest > 0 ? ' · <span class="pb">new best for this level</span>' : ''} · #${rank} of your runs · overall ${pct}%`;
    $('#g-done-title').textContent = stars === 3 ? 'Locked in.' : stars === 2 ? 'Nearly there.' : 'Keep going.';
    $('#g-stars').innerHTML = starsHTML(stars); $('#g-stars').setAttribute('aria-label', stars + ' of 3 stars');
    $('#g-stats').innerHTML = `<dt>From memory</dt><dd>${G.firstTry[2]}/${n}</dd><dt>Accuracy</dt><dd>${Math.round(acc * 100)}%</dd><dt>Time</dt><dd>${fmtTime(secs)}</dd>`;
    const m = $('#g-missed'); m.innerHTML = '';
    if (G.missed.size) { m.appendChild(el('li', null, 'Review:')); m.firstChild.style.border = '0'; G.missed.forEach(x => m.appendChild(el('li', null, esc(x)))); }
    const idx = LEVELS.indexOf(G.level);
    const nb = $('#g-nextlevel');
    if (G.level.id === 'today' || idx === LEVELS.length - 1) nb.innerHTML = 'All levels <span aria-hidden="true">→</span>';
    else nb.innerHTML = 'Next: ' + esc(LEVELS[idx + 1].title) + ' <span aria-hidden="true">→</span>';
    screen('g-done');
    setTimeout(() => nb.focus({ preventScroll: true }), 30);
  }
  $('#g-nextlevel').addEventListener('click', () => {
    const idx = LEVELS.indexOf(G.level);
    if (G.level.id === 'today' || idx === LEVELS.length - 1) location.hash = 'play';
    else location.hash = 'level-' + LEVELS[idx + 1].id;
  });
  $('#g-replay').addEventListener('click', () => { startLevel(G.level); });

  function show(view) {
    ['home', 'play', 'game', 'scores'].forEach(v => { $('#view-' + v).hidden = v !== view; });
    if (view === 'game') gameGlobe.resize();
    if (view === 'home') { heroGlobe.resize(); tlGlobe.resize(); }
  }
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === 'play') { renderLevels(); show('play'); window.scrollTo(0, 0); return; }
    if (h === 'scores') { renderScores(); show('scores'); window.scrollTo(0, 0); return; }
    if (h === 'today') {
      const t = todayItem();
      startLevel({ id: 'today', title: 'Event of the day', sub: '', from: t.level.title, items: [t.item] });
      window.scrollTo(0, 0); return;
    }
    if (h.startsWith('level-')) {
      const lv = LEVELS.find(l => 'level-' + l.id === h);
      if (lv) { startLevel(lv); window.scrollTo(0, 0); return; }
    }
    const wasHidden = $('#view-home').hidden;
    show('home');
    if (wasHidden) buildTimeline();
    const target = h && document.getElementById(h);
    if (target) requestAnimationFrame(() => target.scrollIntoView());
    else if (wasHidden) window.scrollTo(0, 0);
  }
  function renderScores() {
    const p = progress(), all = runs(), pct = updateOverall();
    $('#big-pct').textContent = pct + '%';
    setRing($('#big-ring'), 0);
    requestAnimationFrame(() => requestAnimationFrame(() => setRing($('#big-ring'), pct)));
    const played = LEVELS.filter(l => p[l.id]);
    const stars = played.reduce((a, l) => a + p[l.id].stars, 0);
    const mastered = Math.round(LEVELS.reduce((a, l) => a + (p[l.id] ? p[l.id].acc * l.items.length : 0), 0));
    $('#sc-stats').innerHTML = `<dt>Levels played</dt><dd>${played.length}/${LEVELS.length}</dd><dt>Stars</dt><dd>${stars}/${LEVELS.length * 3}</dd><dt>Names locked in</dt><dd>${mastered}/${TOTAL}</dd><dt>Best score</dt><dd>${all.length ? all[0].score.toLocaleString('en-CA') : '–'}</dd>`;
    const body = $('#runs-body'); body.innerHTML = '';
    if (!all.length) body.innerHTML = '<tr class="empty"><td colspan="6">No runs yet. Finish a level and it shows up here.</td></tr>';
    all.slice(0, 10).forEach((r, i) => {
      body.appendChild(el('tr', null, `<td>${i + 1}</td><td>${esc(r.title)}</td><td>${r.score.toLocaleString('en-CA')}</td><td>${Math.round(r.acc * 100)}%</td><td>${fmtTime(r.secs)}</td><td>${new Date(r.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</td>`));
    });
    const grid = $('#best-levels'); grid.innerHTML = '';
    LEVELS.forEach(l => {
      const r = p[l.id], a = el('a', 'best');
      a.href = '#level-' + l.id;
      a.innerHTML = `<b>${esc(l.title)}</b><span class="pct">${r ? Math.round(r.acc * 100) + '%' : '–'}</span><div class="po-bar"><i style="width:${r ? r.acc * 100 : 0}%"></i></div><span class="meta">${r ? '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) + ' · best ' + r.score.toLocaleString('en-CA') : 'Not played yet'}</span>`;
      grid.appendChild(a);
    });
    $('#reset-confirm').hidden = true; $('#reset-btn').hidden = false;
  }
  $('#reset-btn').addEventListener('click', () => { $('#reset-confirm').hidden = false; $('#reset-btn').hidden = true; $('#reset-no').focus(); });
  $('#reset-no').addEventListener('click', () => { $('#reset-confirm').hidden = true; $('#reset-btn').hidden = false; });
  $('#reset-yes').addEventListener('click', () => { store.set('tectype-progress', {}); store.set('tectype-runs', []); renderScores(); });

  window.addEventListener('hashchange', route);
  document.querySelector('[data-home]').addEventListener('click', e => {
    e.preventDefault();
    if (location.hash && location.hash !== '#') location.hash = '';
    else route();
    window.scrollTo(0, 0);
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || $('#view-game').hidden || e.target.tagName === 'BUTTON' || e.target === input) return;
    if (!$('#g-intro').hidden) { e.preventDefault(); beginRounds(); }
    else if (!$('#g-between').hidden) { e.preventDefault(); startRound(); }
    else if (!$('#g-round').hidden) { focusInput(); }
  });

  buildTimeline();
  updateOverall();
  route();
  GT.prebake();
})();
