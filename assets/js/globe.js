(function () {
  const TW = 512, TH = 256;
  const DEG = Math.PI / 180;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hash3(x, y, z) {
    const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
    return h - Math.floor(h);
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function vnoise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const fx = smooth(x - xi), fy = smooth(y - yi), fz = smooth(z - zi);
    let r = 0;
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const w = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy) * (dz ? fz : 1 - fz);
      r += w * hash3(xi + dx, yi + dy, zi + dz);
    }
    return r;
  }
  function fbm(x, y, z) {
    return (vnoise(x * 2, y * 2, z * 2) * 0.5 + vnoise(x * 4 + 7, y * 4, z * 4) * 0.25 +
      vnoise(x * 8, y * 8 + 3, z * 8) * 0.125 + vnoise(x * 16, y * 16, z * 16 + 5) * 0.0625) / 0.9375;
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;

  const OCEANS = {
    modern: { deep: [10, 38, 84], shallow: [38, 118, 168] },
    iron: { deep: [18, 58, 58], shallow: [62, 118, 92] }
  };
  const LANDS = {
    barren: { low: [150, 112, 84], high: [96, 74, 62] },
    sparse: { low: [118, 120, 78], high: [120, 96, 74] },
    green: { low: [62, 108, 56], high: [116, 104, 72] },
    desert: { low: [196, 156, 98], high: [150, 104, 70] }
  };

  const cache = {};
  function bake(scene) {
    if (cache[scene.id]) return cache[scene.id];
    const tex = new Uint8ClampedArray(TW * TH * 4);
    const blobs = (scene.blobs || []).map(b => {
      const la = b[0] * DEG, lo = b[1] * DEG;
      return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo), b[2] * DEG];
    });
    const ocean = OCEANS[scene.ocean || 'modern'];
    const land = LANDS[scene.land || 'barren'];
    const flood = scene.flood || 0;
    const ice = scene.ice || [91, -91];
    const seaIce = scene.seaIce || [91, -91];
    for (let j = 0; j < TH; j++) {
      const latD = 90 - (j + 0.5) / TH * 180, lat = latD * DEG;
      for (let i = 0; i < TW; i++) {
        const lon = ((i + 0.5) / TW * 360 - 180) * DEG;
        const x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
        const n = fbm(x * 1.6 + 10, y * 1.6 + 10, z * 1.6 + 10);
        let c, emit = 0;
        if (scene.lava) {
          const r = 1 - Math.abs(fbm(x * 1.5 + 3, y * 1.5, z * 1.5) * 2 - 1);
          const g = clamp01((r - 0.78) / 0.2);
          c = mix3([46, 22, 18], [255, 128, 40], g);
          c = mix3(c, [255, 214, 120], clamp01((r - 0.93) / 0.07));
          c = mix3(c, [70, 34, 26], (1 - g) * (n - 0.5));
          emit = g;
        } else {
          let f = 0;
          for (const b of blobs) {
            const d = Math.acos(Math.max(-1, Math.min(1, x * b[0] + y * b[1] + z * b[2])));
            f += Math.exp(-(d / b[3]) * (d / b[3]) * 0.9);
          }
          const h = f + (n - 0.5) * 0.55 - 0.5 - flood;
          if (h > 0) {
            const e = clamp01(h * 1.6 + (n - 0.5) * 0.6);
            c = mix3(land.low, land.high, e);
            if (scene.land === 'desert') c = mix3(c, [212, 172, 110], clamp01(h * 1.4) * 0.6);
            if (scene.land === 'sparse') c = mix3(c, [74, 110, 60], clamp01(1 - h * 4) * 0.7);
            const jl = latD + (n - 0.5) * 14; if (jl > ice[0] || jl < ice[1]) c = mix3([226, 236, 246], [250, 252, 255], n);
          } else {
            const shelf = clamp01((h + 0.16 + flood * 0.9) / (0.16 + flood * 0.9));
            c = mix3(ocean.deep, ocean.shallow, shelf * shelf);
            c = mix3(c, [ocean.deep[0] * 0.8, ocean.deep[1] * 0.8, ocean.deep[2] * 0.85], (0.5 - n) * 0.5);
            const js = latD + (n - 0.5) * 10; if (js > seaIce[0] || js < seaIce[1]) c = mix3(c, [205, 224, 238], 0.85);
          }
          if (scene.snowball) {
            const keep = h > 0 ? 0.92 : 0.82;
            c = mix3(c, h > 0 ? [246, 249, 253] : [210, 228, 242], keep);
            if (Math.abs(latD) < 8 && n > 0.62 && h <= 0) c = mix3(c, ocean.shallow, 0.4);
          }
        }
        const k = (j * TW + i) * 4;
        tex[k] = c[0]; tex[k + 1] = c[1]; tex[k + 2] = c[2]; tex[k + 3] = emit * 255;
      }
    }
    cache[scene.id] = tex;
    return tex;
  }

  class Globe {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.speed = opts.speed ?? 0.12;
      this.tilt = (opts.tilt ?? -12) * DEG;
      this.rot = opts.rot ?? 0.6;
      this.mix = 1;
      this.texA = null; this.texB = null;
      this.scene = null;
      this.visible = true;
      this.drag = null;
      this.last = performance.now();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(es => { this.visible = es[0].isIntersecting; if (this.visible) this.kick(); }).observe(canvas);
      }
      canvas.addEventListener('pointerdown', e => { this.drag = { x: e.clientX, rot: this.rot }; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', e => {
        if (!this.drag) return;
        this.rot = this.drag.rot - (e.clientX - this.drag.x) / this.size * 3;
        this.kick();
      });
      const end = () => { this.drag = null; };
      canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
      this.raf = null;
      this.kick();
    }
    resize() {
      const css = this.canvas.clientWidth || 360;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const N = Math.max(160, Math.min(480, Math.round(css * dpr)));
      if (N === this.N) return;
      this.N = N;
      this.canvas.width = N; this.canvas.height = N;
      this.size = css;
      this.img = this.ctx.createImageData(N, N);
      const R = N * 0.44, cx = N / 2, cy = N / 2;
      this.R = R;
      const count = N * N;
      this.pIdx = new Int32Array(count).fill(-1);
      this.pLon = new Float32Array(count);
      this.pShade = new Float32Array(count);
      this.pRim = new Float32Array(count);
      this.pFy = new Float32Array(count);
      const L = [-0.4, 0.35, 0.85]; const ll = Math.hypot(...L); L[0] /= ll; L[1] /= ll; L[2] /= ll;
      const ct = Math.cos(this.tilt), st = Math.sin(this.tilt);
      for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
        const nx = (px + 0.5 - cx) / R, ny = -(py + 0.5 - cy) / R;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const nz = Math.sqrt(1 - r2);
        const y2 = ny * ct + nz * st, z2 = -ny * st + nz * ct;
        const lat = Math.asin(Math.max(-1, Math.min(1, y2)));
        const lon = Math.atan2(nx, z2);
        const p = py * N + px;
        let fr = (0.5 - lat / Math.PI) * TH - 0.5; if (fr < 0) fr = 0; if (fr > TH - 1.001) fr = TH - 1.001;
        const row = Math.floor(fr);
        this.pIdx[p] = row * TW;
        this.pFy[p] = fr - row;
        this.pLon[p] = lon;
        const lam = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        this.pShade[p] = 0.3 + 0.85 * lam;
        this.pRim[p] = Math.pow(1 - nz, 3);
      }
      this.kick();
    }
    setScene(scene, instant) {
      if (!scene || (this.scene && this.scene.id === scene.id)) return;
      const tex = bake(scene);
      if (!this.texA || instant || reduceMotion) { this.texA = tex; this.mix = 1; this.texB = null; }
      else { if (this.texB) this.texA = this.texB; this.texB = tex; this.mix = 0; }
      this.scene = scene;
      this.kick();
    }
    kick() {
      if (this.raf || !this.visible) return;
      this.last = performance.now();
      this.raf = requestAnimationFrame(t => this.frame(t));
    }
    frame(t) {
      this.raf = null;
      const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
      const spinning = !reduceMotion && !this.drag && this.speed > 0;
      if (spinning) this.rot += dt * this.speed;
      if (this.texB) { this.mix += dt / 0.9; if (this.mix >= 1) { this.texA = this.texB; this.texB = null; this.mix = 1; } }
      this.draw();
      if (this.visible && (spinning || this.texB)) this.raf = requestAnimationFrame(tt => this.frame(tt));
    }
    draw() {
      if (!this.texA) return;
      const N = this.N, d = this.img.data, A = this.texA, B = this.texB, m = this.mix;
      const haze = this.scene ? (this.scene.haze || [120, 170, 255]) : [120, 170, 255];
      const rot = this.rot, TWO = Math.PI * 2;
      for (let p = 0, q = 0; p < N * N; p++, q += 4) {
        const base = this.pIdx[p];
        if (base < 0) { d[q + 3] = 0; continue; }
        let u = (this.pLon[p] + rot) / TWO + 0.5; u -= Math.floor(u);
        const fu = u * TW - 0.5, c0 = Math.floor(fu), fx = fu - c0;
        const x0 = (c0 + TW) % TW, x1 = (c0 + 1) % TW, fy = this.pFy[p];
        const k00 = (base + x0) * 4, k01 = (base + x1) * 4, k10 = k00 + TW * 4, k11 = k01 + TW * 4;
        const w00 = (1 - fx) * (1 - fy), w01 = fx * (1 - fy), w10 = (1 - fx) * fy, w11 = fx * fy;
        let r = A[k00] * w00 + A[k01] * w01 + A[k10] * w10 + A[k11] * w11;
        let g = A[k00 + 1] * w00 + A[k01 + 1] * w01 + A[k10 + 1] * w10 + A[k11 + 1] * w11;
        let b = A[k00 + 2] * w00 + A[k01 + 2] * w01 + A[k10 + 2] * w10 + A[k11 + 2] * w11;
        let e = A[k00 + 3] * w00 + A[k01 + 3] * w01 + A[k10 + 3] * w10 + A[k11 + 3] * w11;
        if (B) {
          r += (B[k00] * w00 + B[k01] * w01 + B[k10] * w10 + B[k11] * w11 - r) * m;
          g += (B[k00 + 1] * w00 + B[k01 + 1] * w01 + B[k10 + 1] * w10 + B[k11 + 1] * w11 - g) * m;
          b += (B[k00 + 2] * w00 + B[k01 + 2] * w01 + B[k10 + 2] * w10 + B[k11 + 2] * w11 - b) * m;
          e += (B[k00 + 3] * w00 + B[k01 + 3] * w01 + B[k10 + 3] * w10 + B[k11 + 3] * w11 - e) * m;
        }
        let s = this.pShade[p];
        const em = e / 255; if (em > 0) s = s + (1.1 - s) * em;
        const rim = this.pRim[p] * 0.85;
        d[q] = r * s + (haze[0] - r * s) * rim;
        d[q + 1] = g * s + (haze[1] - g * s) * rim;
        d[q + 2] = b * s + (haze[2] - b * s) * rim;
        d[q + 3] = 255;
      }
      const ctx = this.ctx;
      ctx.clearRect(0, 0, N, N);
      const gr = ctx.createRadialGradient(N / 2, N / 2, this.R * 0.96, N / 2, N / 2, this.R * 1.12);
      gr.addColorStop(0, `rgba(${haze[0]},${haze[1]},${haze[2]},0.45)`);
      gr.addColorStop(1, `rgba(${haze[0]},${haze[1]},${haze[2]},0)`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, N, N);
      if (!this.off || this.off.width !== N) { this.off = document.createElement('canvas'); this.off.width = N; this.off.height = N; this.offCtx = this.off.getContext('2d'); }
      this.offCtx.putImageData(this.img, 0, 0);
      ctx.drawImage(this.off, 0, 0);
    }
  }

  GT.Globe = Globe;
  GT.sceneById = id => GT.SCENES.find(s => s.id === id);
  GT.sceneForAge = ma => GT.SCENES.find(s => ma <= s.from && ma > s.to) || GT.SCENES[GT.SCENES.length - 1];
  GT.prebake = () => {
    const todo = GT.SCENES.slice();
    const step = () => { const s = todo.shift(); if (!s) return; bake(s); setTimeout(() => (window.requestIdleCallback || setTimeout)(step), 30); };
    step();
  };
})();
