/* ===================================
   Manjunath M V — portfolio scripts
=================================== */
(() => {
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. Animated circuit-trace background ---------- */
const bg = $('#bg'), bx = bg.getContext('2d');
const GRID = 48;
let W, H, traces = [], mouse = { x: -999, y: -999 };

function build() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  bg.width = W * dpr; bg.height = H * dpr;
  bx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cols = Math.ceil(W / GRID), rows = Math.ceil(H / GRID);
  const n = Math.min(34, Math.round((W * H) / 55000) + 8);
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  traces = [];
  for (let i = 0; i < n; i++) {
    let gx = Math.floor(Math.random() * cols), gy = Math.floor(Math.random() * rows);
    let d = Math.floor(Math.random() * 4);
    const pts = [[gx * GRID, gy * GRID]];
    const segs = 4 + Math.floor(Math.random() * 6);
    for (let s = 0; s < segs; s++) {
      const len = 2 + Math.floor(Math.random() * 6);
      gx = Math.max(0, Math.min(cols, gx + dirs[d][0] * len));
      gy = Math.max(0, Math.min(rows, gy + dirs[d][1] * len));
      pts.push([gx * GRID, gy * GRID]);
      d = (d + (Math.random() < .5 ? 1 : 3)) % 4;           // turn 90°
    }
    const cum = [0];
    for (let k = 1; k < pts.length; k++)
      cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    traces.push({ pts, cum, total: cum[cum.length - 1] || 1, t: Math.random(), speed: .0009 + Math.random() * .0018,
                  hue: Math.random() < .25 ? '0,229,195' : '0,170,255' });
  }
}
function at(tr, dist) {
  dist = Math.max(0, Math.min(tr.total, dist));
  let k = 1; while (k < tr.cum.length - 1 && tr.cum[k] < dist) k++;
  const a = tr.pts[k - 1], b = tr.pts[k], f = (dist - tr.cum[k - 1]) / ((tr.cum[k] - tr.cum[k - 1]) || 1);
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}
function frame() {
  bx.clearRect(0, 0, W, H);
  for (const tr of traces) {
    // static trace
    bx.beginPath();
    tr.pts.forEach((p, i) => i ? bx.lineTo(p[0], p[1]) : bx.moveTo(p[0], p[1]));
    bx.strokeStyle = 'rgba(0,170,255,.07)'; bx.lineWidth = 1.5; bx.stroke();
    // via dots at corners
    bx.fillStyle = 'rgba(0,170,255,.18)';
    tr.pts.forEach(p => { bx.beginPath(); bx.arc(p[0], p[1], 2.2, 0, 6.3); bx.fill(); });

    // travelling pulse with fading tail
    if (!reduce) tr.t = (tr.t + tr.speed) % 1.25;
    const head = tr.t * tr.total * 1.0;
    for (let s = 0; s < 14; s++) {
      const [x, y] = at(tr, head - s * 7);
      if (head - s * 7 < 0 || head - s * 7 > tr.total) continue;
      const near = Math.hypot(x - mouse.x, y - mouse.y) < 160 ? 1.8 : 1;
      bx.beginPath(); bx.arc(x, y, (3.2 - s * .18) * near, 0, 6.3);
      bx.fillStyle = `rgba(${tr.hue},${(.85 - s * .06) * (near > 1 ? 1 : .75)})`;
      bx.shadowColor = `rgb(${tr.hue})`; bx.shadowBlur = s === 0 ? 14 : 0;
      bx.fill();
    }
    bx.shadowBlur = 0;
  }
  requestAnimationFrame(frame);
}
build(); frame();
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 200); });
addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

/* ---------- 2. Typing effect ---------- */
const roles = ['Electronics Engineer', 'Embedded Systems & IoT', 'Analog & Digital Circuit Design', 'ESP32 • Arduino • Embedded C', 'Hardware Debug & Verification', 'Cadence • LTspice • Verilog'];
const typed = $('#typed');
let ri = 0, ci = 0, del = false;
(function type() {
  const word = roles[ri];
  if (reduce) { typed.textContent = word; return; }
  typed.textContent = word.slice(0, ci);
  if (!del && ci < word.length) { ci++; setTimeout(type, 70); }
  else if (!del) { del = true; setTimeout(type, 1500); }
  else if (ci > 0) { ci--; setTimeout(type, 35); }
  else { del = false; ri = (ri + 1) % roles.length; setTimeout(type, 300); }
})();

/* ---------- 3. Reveal on scroll + counters ---------- */
function count(el) {
  const target = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
  const dur = 1400, t0 = performance.now();
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * e).toFixed(dec);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toFixed(dec) + (el.dataset.suffix === undefined ? '' : el.dataset.suffix);
  })(t0);
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  $$('[data-count]', e.target).forEach(count);
  io.unobserve(e.target);
}), { threshold: .12 });
$$('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 3) * 90 + 'ms';
  io.observe(el);
});

/* ---------- 4. Nav: scroll progress, active link, mobile menu, back-to-top ---------- */
const nav = $('#navbar'), prog = $('#progress'), toTop = $('#toTop');
addEventListener('scroll', () => {
  const h = document.documentElement;
  prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
  nav.classList.toggle('small', h.scrollTop > 40);
  toTop.classList.toggle('show', h.scrollTop > 700);
}, { passive: true });
toTop.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

const links = $$('.nav-links a');
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting)
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('section[id]').forEach(s => spy.observe(s));

$('#burger').onclick = () => $('#navLinks').classList.toggle('open');
links.forEach(a => a.addEventListener('click', () => $('#navLinks').classList.remove('open')));

/* ---------- 5. Filters (projects + certs) ---------- */
$$('.filters').forEach(bar => {
  const grid = document.getElementById(bar.dataset.target);
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', bar).forEach(x => x.classList.toggle('active', x === b));
    const f = b.dataset.filter;
    $$('.card', grid).forEach(c => {
      c.classList.toggle('hide', f !== 'all' && c.dataset.cat !== f);
      c.classList.add('in');
    });
  });
});

/* ---------- 6. 3D tilt + spotlight on cards ---------- */
if (!reduce && matchMedia('(hover:hover)').matches) {
  $$('.tilt').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
      c.style.setProperty('--ry', ((x / r.width - .5) * 7).toFixed(2) + 'deg');
      c.style.setProperty('--rx', ((.5 - y / r.height) * 7).toFixed(2) + 'deg');
    });
    c.addEventListener('mouseleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });
}

/* ---------- 7. Image fallback (missing screenshots still look designed) ---------- */
$$('.thumb img').forEach(img => {
  const fail = () => img.parentElement.classList.add('noimg');
  img.addEventListener('error', fail);
  if (img.complete && img.naturalWidth === 0) fail();
});

/* ---------- Easter egg ---------- */
console.log('%c<MMV/> %cBuilding future silicon. Say hi: manjunathvannur21@gmail.com',
  'color:#00aaff;font:700 20px monospace', 'color:#00e5c3;font:14px monospace');
})();
