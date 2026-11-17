(function () {
  let uid = 0;
  const f = n => +n.toFixed(1);
  const P = (d, a = '') => `<path d="${d}" ${a}/>`;
  const fill = 'fill="currentColor" fill-opacity=".1"';
  const thin = 'stroke-width="1.2" opacity=".75"';

  function trilobite() {
    let s = P('M44 76 C48 32 152 32 156 76 Z', fill);
    s += P('M44 76 L34 116 M156 76 L166 116');
    s += '<ellipse cx="100" cy="56" rx="14" ry="17" fill="currentColor" fill-opacity=".14"/>';
    s += P('M70 66 q6 -10 14 -4 M130 66 q-6 -10 -14 -4');
    s += P('M46 78 C50 110 56 136 62 150 M154 78 C150 110 144 136 138 150', fill);
    for (let i = 0; i < 11; i++) {
      const y = 79 + i * 6.6, w = 56 - i * 1.7;
      s += P(`M${f(100 - w)} ${f(y)} Q100 ${f(y + 4)} ${f(100 + w)} ${f(y)}`);
    }
    s += P('M86 78 L90 150 M114 78 L110 150');
    s += P('M62 150 Q100 192 138 150 Z', fill);
    for (let i = 1; i < 4; i++) s += P(`M${68 + i * 5} ${150 + i * 6} Q100 ${154 + i * 8} ${132 - i * 5} ${150 + i * 6}`, thin);
    return s;
  }

  function brachiopod() {
    const out = 'M68 54 C34 84 46 162 100 168 C154 162 166 84 132 54 Z', id = 'br' + (++uid);
    let s = `<defs><clipPath id="${id}"><path d="${out}"/></clipPath></defs>` + P(out, fill) + P('M86 54 Q100 28 114 54');
    s += `<g clip-path="url(#${id})">`;
    for (let a = -10; a <= 190; a += 8) {
      const t = a * Math.PI / 180;
      s += P(`M100 50 L${f(100 + 140 * Math.cos(t))} ${f(50 + 140 * Math.sin(t))}`, thin);
    }
    s += '</g>';
    [0.45, 0.7].forEach(k => s += P(`M${f(100 - 32 * k)} ${f(54 + 30 * k)} C${f(100 - 66 * k)} ${f(54 + 108 * k)} ${f(100 - 30 * k)} ${f(54 + 112 * k)} 100 ${f(54 + 114 * k)} C${f(100 + 30 * k)} ${f(54 + 112 * k)} ${f(100 + 66 * k)} ${f(54 + 108 * k)} ${f(100 + 32 * k)} ${f(54 + 30 * k)}`, 'stroke-width="1.6"'));
    return s;
  }

  function bivalve() {
    let s = P('M48 112 C46 64 108 40 150 78 C178 104 164 150 112 160 C70 166 50 144 48 112 Z', fill);
    s += P('M84 62 Q86 40 100 48');
    [0.35, 0.55, 0.75, 0.9].forEach(k => {
      const cx = 92, cy = 60, sx = x => f(cx + (x - cx) * k), sy = y => f(cy + (y - cy) * k);
      s += P(`M${sx(48)} ${sy(112)} C${sx(46)} ${sy(64)} ${sx(108)} ${sy(40)} ${sx(150)} ${sy(78)} C${sx(178)} ${sy(104)} ${sx(164)} ${sy(150)} ${sx(112)} ${sy(160)} C${sx(70)} ${sy(166)} ${sx(50)} ${sy(144)} ${sx(48)} ${sy(112)}`, thin);
    });
    return s;
  }

  function graptolite() {
    let s = P('M100 52 L100 22', thin);
    const branch = (x2, dir) => {
      let d = `M100 52 Q${f(100 + dir * 18)} 110 ${x2} 176`, teeth = '';
      for (let i = 0; i < 13; i++) {
        const t = (i + 0.5) / 13, u = 1 - t;
        const x = u * u * 100 + 2 * u * t * (100 + dir * 18) + t * t * x2;
        const y = u * u * 52 + 2 * u * t * 110 + t * t * 176;
        teeth += P(`M${f(x)} ${f(y)} l${f(dir * 10)} ${f(-3)} l${f(-dir * 4)} 10`, 'stroke-width="1.5"');
      }
      return P(d, 'stroke-width="2.6"') + teeth;
    };
    s += branch(46, -1) + branch(154, 1);
    s += '<path d="M97 44 L100 56 L103 44 Z" fill="currentColor"/>';
    return s;
  }

  function crinoid() {
    let s = '';
    for (let y = 192; y > 116; y -= 6) s += `<rect x="94" y="${y - 6}" width="12" height="6" rx="1.5" ${fill}/>`;
    s += P('M86 116 Q78 96 86 84 L114 84 Q122 96 114 116 Z', fill);
    s += P('M93 84 L95 116 M107 84 L105 116 M84 100 L116 100', thin);
    [-58, -32, -10, 10, 32, 58].forEach(a => {
      const t = a * Math.PI / 180, x0 = 100 + a / 6, ex = 100 + Math.sin(t) * 82, ey = 84 - Math.cos(t) * 66;
      const cx = 100 + Math.sin(t) * 30, cy = 40;
      s += P(`M${f(x0)} 84 Q${f(cx)} ${cy} ${f(ex)} ${f(ey)}`, 'stroke-width="2.2"');
      for (let i = 2; i < 10; i++) {
        const k = i / 10, u = 1 - k;
        const x = u * u * x0 + 2 * u * k * cx + k * k * ex, y = u * u * 84 + 2 * u * k * cy + k * k * ey;
        s += P(`M${f(x)} ${f(y)} l-5 -4 M${f(x)} ${f(y)} l5 -4`, 'stroke-width="1"');
      }
    });
    return s;
  }

  function orthocerid() {
    let s = '<g transform="rotate(38 100 100)">';
    s += P('M98 192 L76 14 L124 14 L102 192 Z', fill);
    s += '<ellipse cx="100" cy="14" rx="24" ry="5"/>';
    let y = 186, gap = 5;
    while (y > 52) {
      const h = 2 + (192 - y) / 178 * 22;
      s += P(`M${f(100 - h)} ${f(y)} Q100 ${f(y + 5)} ${f(100 + h)} ${f(y)}`, 'stroke-width="1.4"');
      gap *= 1.09; y -= gap;
    }
    s += P('M100 190 L100 54', 'stroke-dasharray="3 3" stroke-width="1.2"');
    return s + '</g>';
  }

  function ammonite() {
    const cx = 100, cy = 102, R = 84, k = Math.log(1 / 0.56) / (2 * Math.PI);
    const pt = (phi, scale = 1) => { const r = R * Math.exp(-k * phi) * scale, a = -phi - 0.4; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    let d = '';
    for (let phi = 0; phi <= 9 * Math.PI; phi += 0.08) { const [x, y] = pt(phi); d += (d ? 'L' : 'M') + f(x) + ' ' + f(y); }
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" ${fill}/>` + P(d, 'stroke-width="2.2"');
    for (let phi = 0.1; phi < 7 * Math.PI; phi += 0.17 + phi * 0.002) {
      const [x1, y1] = pt(phi), [x2, y2] = pt(phi + 2 * Math.PI);
      const [mx, my] = pt(phi + 0.18, 0.78 + 0.0 * phi);
      s += P(`M${f(x1)} ${f(y1)} Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}`, thin);
    }
    const [ax, ay] = pt(0), [bx, by] = pt(2 * Math.PI);
    s += P(`M${f(ax)} ${f(ay)} L${f(bx)} ${f(by)}`, 'stroke-width="2.2"');
    return s;
  }

  function rugose() {
    let s = P('M64 184 Q66 112 80 52 L160 52 Q140 132 70 186 Z', fill);
    for (let i = 1; i < 9; i++) {
      const t = i / 9, u = 1 - t;
      const lx = u * u * 64 + 2 * u * t * 66 + t * t * 80, ly = u * u * 184 + 2 * u * t * 112 + t * t * 52;
      const rx = u * u * 70 + 2 * u * t * 140 + t * t * 160, ry = u * u * 186 + 2 * u * t * 132 + t * t * 52;
      s += P(`M${f(lx)} ${f(ly)} Q${f((lx + rx) / 2)} ${f((ly + ry) / 2 + 7)} ${f(rx)} ${f(ry)}`, thin);
    }
    s += '<ellipse cx="120" cy="52" rx="40" ry="13" fill="currentColor" fill-opacity=".18"/>';
    for (let a = 0; a < 360; a += 15) {
      const t = a * Math.PI / 180;
      s += P(`M${f(120 + 9 * Math.cos(t))} ${f(52 + 3 * Math.sin(t))} L${f(120 + 39 * Math.cos(t))} ${f(52 + 12.5 * Math.sin(t))}`, 'stroke-width="1"');
    }
    return s;
  }

  function tabulate() {
    const id = 'tb' + (++uid);
    let s = `<defs><clipPath id="${id}"><path d="M30 100 C30 46 70 24 104 26 C150 28 174 62 172 104 C170 148 136 176 98 174 C58 172 30 148 30 100 Z"/></clipPath></defs>`;
    s += P('M30 100 C30 46 70 24 104 26 C150 28 174 62 172 104 C170 148 136 176 98 174 C58 172 30 148 30 100 Z', fill);
    s += `<g clip-path="url(#${id})" stroke-width="1.6">`;
    const r = 12, w = r * Math.sqrt(3);
    for (let row = -1; row < 12; row++) for (let col = -1; col < 10; col++) {
      const x = col * w + (row % 2 ? w / 2 : 0) + 18, y = row * r * 1.5 + 22;
      let d = '';
      for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; d += (i ? 'L' : 'M') + f(x + r * Math.cos(a)) + ' ' + f(y + r * Math.sin(a)); }
      s += P(d + 'Z') + `<circle cx="${f(x)}" cy="${f(y)}" r="1.4" fill="currentColor" stroke="none"/>`;
    }
    return s + '</g>';
  }

  function bryozoan() {
    const fan = 'M100 188 L28 70 Q100 8 172 70 Z', id = 'bz' + (++uid);
    let s = `<defs><clipPath id="${id}"><path d="${fan}"/></clipPath></defs>` + P(fan, fill) + `<g clip-path="url(#${id})">`;
    const n = 14, ang = i => (-52 + i * (104 / (n - 1))) * Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const t = ang(i);
      s += P(`M100 188 L${f(100 + Math.sin(t) * 150)} ${f(188 - Math.cos(t) * 150)}`, 'stroke-width="1.8"');
    }
    for (let r = 40; r < 150; r += 11) for (let i = 0; i < n - 1; i++) {
      const a = ang(i), b = ang(i + 1);
      s += P(`M${f(100 + Math.sin(a) * r)} ${f(188 - Math.cos(a) * r)} L${f(100 + Math.sin(b) * r)} ${f(188 - Math.cos(b) * r)}`, 'stroke-width="1.1"');
    }
    return s + '</g>';
  }

  function eurypterid() {
    let s = P('M68 70 C66 40 80 26 100 26 C120 26 134 40 132 70 Z', fill);
    s += '<ellipse cx="86" cy="44" rx="6" ry="4" fill="currentColor" fill-opacity=".3"/><ellipse cx="114" cy="44" rx="6" ry="4" fill="currentColor" fill-opacity=".3"/>';
    s += P('M70 62 C40 70 28 100 36 118 C48 110 60 92 74 74', fill);
    s += P('M130 62 C160 70 172 100 164 118 C152 110 140 92 126 74', fill);
    s += P('M74 50 l-22 -14 l-6 6 M126 50 l22 -14 l6 6 M72 58 l-24 0 M128 58 l24 0', 'stroke-width="1.4"');
    let y = 72;
    for (let i = 0; i < 12; i++) {
      const w = 32 - i * 2.1, h = 8.2 - i * 0.15;
      s += `<rect x="${f(100 - w)}" y="${f(y)}" width="${f(w * 2)}" height="${f(h)}" rx="${f(h / 2)}" ${fill}/>`;
      y += h + 0.6;
    }
    s += P(`M100 ${f(y)} L96 ${f(y + 6)} L100 194 L104 ${f(y + 6)} Z`, fill);
    return s;
  }

  function gastropod() {
    let s = '', y = 156, h = 46, w = 46;
    const bands = [];
    for (let i = 0; i < 7; i++) { bands.push([y, h, w]); y -= h * 0.66; h *= 0.76; w *= 0.76; }
    bands.reverse().forEach(([y, h, w]) => {
      s += P(`M${f(100 - w)} ${f(y)} C${f(100 - w - 8)} ${f(y - h * 0.6)} ${f(100 - w * 0.6)} ${f(y - h * 0.95)} ${f(100 - w * 0.5)} ${f(y - h)} L${f(100 + w * 0.5)} ${f(y - h * 1.12)} C${f(100 + w * 0.7)} ${f(y - h)} ${f(100 + w + 8)} ${f(y - h * 0.5)} ${f(100 + w)} ${f(y)} C${f(100 + w * 0.4)} ${f(y + h * 0.28)} ${f(100 - w * 0.4)} ${f(y + h * 0.14)} ${f(100 - w)} ${f(y)} Z`, fill);
    });
    s += P('M62 156 C58 176 76 192 96 186 C112 180 110 164 98 158', fill);
    s += P('M100 24 L100 18', 'stroke-width="2"');
    return s;
  }

  function echinoid() {
    let s = `<circle cx="100" cy="100" r="74" ${fill}/>`;
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + k * 2 * Math.PI / 5, ca = Math.cos(a), sa = Math.sin(a);
      const tip = [100 + ca * 58, 100 + sa * 58], side = (sgn) => [100 + ca * 30 - sa * 13 * sgn, 100 + sa * 30 + ca * 13 * sgn];
      const [l, r] = [side(1), side(-1)];
      s += P(`M${f(100 + ca * 10)} ${f(100 + sa * 10)} Q${f(l[0])} ${f(l[1])} ${f(tip[0])} ${f(tip[1])} Q${f(r[0])} ${f(r[1])} ${f(100 + ca * 10)} ${f(100 + sa * 10)} Z`, 'fill="currentColor" fill-opacity=".14"');
      for (let i = 1; i < 6; i++) {
        const d = 12 + i * 8, off = Math.sin(i / 6 * Math.PI) * 8;
        [1, -1].forEach(sg => s += `<circle cx="${f(100 + ca * d - sa * off * sg)}" cy="${f(100 + sa * d + ca * off * sg)}" r="1.5" fill="currentColor" stroke="none"/>`);
      }
      const b = a + Math.PI / 5;
      for (let d = 40; d < 72; d += 11) s += `<circle cx="${f(100 + Math.cos(b) * d)}" cy="${f(100 + Math.sin(b) * d)}" r="2.6" fill="currentColor" fill-opacity=".35" stroke="none"/>`;
    }
    s += '<circle cx="100" cy="100" r="9"/>';
    return s;
  }

  function stromatolite() {
    let s = P('M20 180 L180 180', 'stroke-width="2.4"');
    [[58, 34, 110], [128, 30, 120], [168, 18, 60], [24, 16, 50]].forEach(([x, w, hmax]) => {
      for (let i = 0; i < 16; i++) {
        const y = 180 - i * (hmax / 16), ww = w * (1 - i / 40), hh = 10 + i * 0.6;
        s += P(`M${f(x - ww)} ${f(y)} Q${f(x)} ${f(y - hh * 2)} ${f(x + ww)} ${f(y)}`, i % 3 ? thin : 'stroke-width="1.8"');
      }
    });
    return s;
  }

  function kimberella() {
    let d = '';
    for (let i = 0; i <= 64; i++) {
      const t = i / 64 * 2 * Math.PI, bump = 1 + 0.05 * Math.sin(t * 18);
      d += (i ? 'L' : 'M') + f(100 + 52 * bump * Math.cos(t)) + ' ' + f(102 + 78 * bump * Math.sin(t));
    }
    let s = P(d + 'Z', fill);
    s += '<ellipse cx="100" cy="104" rx="34" ry="60" fill="currentColor" fill-opacity=".12"/>';
    s += P('M100 48 L100 160', 'stroke-width="1.8"');
    for (let y = 58; y < 156; y += 8) { const w = Math.sqrt(1 - Math.pow((y - 104) / 60, 2)) * 32; s += P(`M${f(100 - w)} ${f(y + 2)} Q100 ${y - 3} ${f(100 + w)} ${f(y + 2)}`, thin); }
    s += P('M90 30 Q100 14 110 30', 'stroke-width="1.6"');
    return s;
  }

  function fern() {
    let s = P('M96 192 Q92 110 112 18', 'stroke-width="2.4"');
    for (let i = 0; i < 13; i++) {
      const t = 0.08 + i * 0.07, u = 1 - t;
      const x = u * u * 96 + 2 * u * t * 92 + t * t * 112, y = u * u * 192 + 2 * u * t * 110 + t * t * 18;
      const len = 62 * (1 - t * 0.85);
      [1, -1].forEach(sg => {
        const ex = x + sg * len, ey = y - len * 0.35;
        s += P(`M${f(x)} ${f(y)} Q${f(x + sg * len * 0.5)} ${f(y - len * 0.42)} ${f(ex)} ${f(ey)} Q${f(x + sg * len * 0.5)} ${f(y - len * 0.02)} ${f(x)} ${f(y)} Z`, fill);
        for (let j = 1; j < 5; j++) {
          const px = x + sg * len * j / 5, py = y - len * 0.35 * j / 5 - len * 0.08;
          s += P(`M${f(px)} ${f(py + len * 0.06)} l${f(sg * 3)} -6`, 'stroke-width="1"');
        }
      });
    }
    return s;
  }

  function dunkleosteus() {
    let s = P('M124 64 C150 62 178 82 194 98 C178 112 152 128 124 122', 'stroke-dasharray="4 4" stroke-width="1.6"');
    s += P('M194 98 L186 78 M194 98 L186 118', 'stroke-dasharray="4 4" stroke-width="1.6"');
    s += P('M28 108 C26 62 84 44 124 60 L128 122 C96 140 52 140 28 108 Z', fill);
    s += '<circle cx="60" cy="84" r="10"/><circle cx="60" cy="84" r="3.5" fill="currentColor"/>';
    s += P('M30 112 L44 126 L52 118 L62 132 L72 122 L92 130 L104 124', 'stroke-width="2"');
    s += P('M80 50 L86 126 M104 52 L108 128 M28 100 C50 98 70 104 84 112', thin);
    return s;
  }

  function meganeura() {
    let s = '<circle cx="100" cy="34" r="10" fill="currentColor" fill-opacity=".18"/>';
    s += '<ellipse cx="100" cy="58" rx="9" ry="16" fill="currentColor" fill-opacity=".14"/>';
    for (let i = 0; i < 10; i++) s += `<rect x="96.5" y="${74 + i * 12}" width="7" height="11" rx="3" ${fill}/>`;
    const wing = (x0, y0, x1, y1, sg) => {
      let w = P(`M${x0} ${y0} C${x0 + sg * 30} ${y0 - 14} ${x1 - sg * 10} ${y1 - 14} ${x1} ${y1} C${x1 - sg * 6} ${y1 + 12} ${x0 + sg * 30} ${y0 + 16} ${x0} ${y0 + 8} Z`, fill);
      for (let k = 1; k < 4; k++) w += P(`M${x0} ${y0 + k * 2} Q${f((x0 + x1) / 2)} ${f((y0 + y1) / 2 - 6 + k * 4)} ${f(x1 - sg * 6)} ${f(y1 + k * 2 - 2)}`, 'stroke-width=".9"');
      for (let k = 1; k < 9; k++) { const x = x0 + (x1 - x0) * k / 9; w += P(`M${f(x)} ${f(y0 + (y1 - y0) * k / 9 - 6)} l0 12`, 'stroke-width=".7" opacity=".7"'); }
      return w;
    };
    s += wing(94, 50, 8, 40, -1) + wing(106, 50, 192, 40, 1) + wing(94, 64, 14, 82, -1) + wing(106, 64, 186, 82, 1);
    return s;
  }

  function dimetrodon() {
    let tops = '', s = '';
    for (let x = 58; x <= 146; x += 6) {
      const t = (x - 58) / 88, top = 118 - Math.sin(t * Math.PI) * 78;
      s += P(`M${x} ${f(120 - Math.sin(t * Math.PI) * 4)} L${x} ${f(top)}`, 'stroke-width="1.6"');
      tops += (tops ? 'L' : 'M') + x + ' ' + f(top);
    }
    s = P(tops + 'L146 118 L58 118 Z', 'fill="currentColor" fill-opacity=".14" stroke-width="1.4"') + s;
    s += P('M22 128 C28 116 46 112 60 118 C90 114 130 114 150 120 C170 126 186 138 196 156 C178 146 162 140 146 142 C120 148 80 148 60 140 C48 138 36 140 24 136 Z', fill);
    s += P('M24 132 L48 132', thin);
    s += '<circle cx="38" cy="122" r="2.4" fill="currentColor"/>';
    s += P('M72 144 L66 166 L58 168 M88 146 L94 166 L102 168 M128 146 L122 166 L114 168 M142 142 L150 162 L158 164', 'stroke-width="2"');
    return s;
  }

  const DRAW = { trilobite, brachiopod, bivalve, graptolite, crinoid, orthocerid, ammonite, rugose, tabulate, bryozoan, eurypterid, gastropod, echinoid, stromatolite, kimberella, fern, dunkleosteus, meganeura, dimetrodon };

  GT.fossilSVG = (id, label) =>
    `<svg class="fossil-svg" viewBox="0 0 200 200" role="img" aria-label="${label || 'Fossil drawing'}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${DRAW[id] ? DRAW[id]() : ''}</svg>`;

  GT.FOSSILS = [
    { id: 'stromatolite', name: 'Stromatolite', group: 'Cyanobacteria mats', start: 3500, end: 0, from: 'Archean', to: 'still alive',
      look: 'Stacked, domed layers of trapped sediment.', note: 'Peaked in the Mesoproterozoic; still growing in Shark Bay, Australia.' },
    { id: 'kimberella', name: 'Kimberella', group: 'Ediacara fauna', start: 558, end: 541, from: 'Ediacaran', to: 'Ediacaran',
      look: 'Soft oval body with a crinkled frill.', note: 'Soft-bodied; one of the first animals that moved over the sea floor.' },
    { id: 'trilobite', name: 'Trilobite', group: 'Arthropod', start: 521, end: 251, from: 'Cambrian', to: 'end-Permian',
      look: 'Head shield, segmented body, three lengthwise lobes.', note: 'The signature Paleozoic fossil; wiped out in the end-Permian extinction.' },
    { id: 'brachiopod', name: 'Brachiopod', group: 'Lophophorate', start: 535, end: 0, from: 'Cambrian', to: 'still alive',
      look: 'Two unequal shells, symmetric left to right, ribs fan from a beak.', note: 'Not a clam: a clam’s two valves mirror each other, a brachiopod’s are split top and bottom.' },
    { id: 'graptolite', name: 'Graptolite', group: 'Hemichordate colony', start: 510, end: 320, from: 'Cambrian', to: 'Carboniferous',
      look: 'Thin pencil-like branches with saw-tooth cups.', note: 'Floating forms make excellent Ordovician–Silurian index fossils.' },
    { id: 'crinoid', name: 'Crinoid', group: 'Echinoderm', start: 485, end: 0, from: 'Cambrian (lecture)', to: 'still alive',
      look: 'A stalk of stacked discs, a cup and feathery arms.', note: '“Sea lilies”. Stem discs fill Ontario’s Devonian and Carboniferous limestones.' },
    { id: 'orthocerid', name: 'Orthocerid', group: 'Cephalopod', start: 480, end: 210, from: 'Ordovician', to: 'Triassic',
      look: 'Straight cone divided into chambers, tube through the middle.', note: 'Straight-shelled relatives of the squid; common in Carboniferous seas.' },
    { id: 'ammonite', name: 'Ammonite', group: 'Cephalopod', start: 410, end: 66, from: 'Devonian', to: 'end-Cretaceous',
      look: 'Tightly coiled, ribbed spiral shell.', note: 'Ammonoids (goniatites in the Devonian) survive the Permian but vanish at 66 Ma.' },
    { id: 'rugose', name: 'Rugose coral', group: 'Cnidarian', start: 460, end: 251, from: 'Ordovician', to: 'end-Permian',
      look: 'A horn with wrinkled walls and radial plates in the cup.', note: '“Horn corals”; ended in the end-Permian extinction.' },
    { id: 'tabulate', name: 'Tabulate coral', group: 'Cnidarian', start: 485, end: 251, from: 'Ordovician', to: 'end-Permian',
      look: 'A honeycomb of small tubes.', note: 'Colonial reef builders such as Favosites.' },
    { id: 'bryozoan', name: 'Bryozoan', group: 'Colonial animal', start: 480, end: 0, from: 'Ordovician', to: 'still alive',
      look: 'A lacy fan net of tiny windows.', note: '“Moss animals”: tiny filter feeders in a carbonate frame.' },
    { id: 'eurypterid', name: 'Eurypterid', group: 'Arthropod', start: 467, end: 251, from: 'Ordovician', to: 'end-Permian',
      look: 'Sea scorpion: head shield, swimming paddles, long segmented tail with a spike.', note: 'Some grew longer than a person; gone in the end-Permian extinction.' },
    { id: 'gastropod', name: 'Gastropod', group: 'Mollusc', start: 520, end: 0, from: 'Cambrian', to: 'still alive',
      look: 'One coiled, spired shell.', note: 'Snails: survived every mass extinction.' },
    { id: 'bivalve', name: 'Bivalve', group: 'Mollusc', start: 520, end: 0, from: 'Cambrian', to: 'still alive',
      look: 'Two mirror-image shells with growth lines.', note: 'Clams and mussels.' },
    { id: 'echinoid', name: 'Echinoid', group: 'Echinoderm', start: 470, end: 0, from: 'Ordovician', to: 'still alive',
      look: 'Round test with a five-petal star.', note: 'Sea urchins; five-part symmetry like all echinoderms.' },
    { id: 'fern', name: 'Fern', group: 'Vascular plant', start: 360, end: 0, from: 'Late Devonian', to: 'still alive',
      look: 'A frond of paired leaflets.', note: 'Reproduce by spores, so early forests stayed by water. Coal-forest plant.' },
    { id: 'dunkleosteus', name: 'Dunkleosteus', group: 'Placoderm fish', start: 382, end: 358, from: 'Devonian', to: 'end-Devonian',
      look: 'Armoured head plates with bony jaw blades.', note: 'Top predator of the Devonian “Age of Fish”.' },
    { id: 'meganeura', name: 'Meganeura', group: 'Giant insect', start: 310, end: 270, from: 'Carboniferous', to: 'Permian',
      look: 'Dragonfly-like insect with huge veined wings.', note: 'High oxygen let Late Paleozoic insects grow enormous.' },
    { id: 'dimetrodon', name: 'Dimetrodon', group: 'Synapsid', start: 295, end: 272, from: 'Permian', to: 'Permian',
      look: 'Four-legged animal with a tall spined sail on its back.', note: 'An early amniote predator; closer to mammals than to dinosaurs.' }
  ];
})();
