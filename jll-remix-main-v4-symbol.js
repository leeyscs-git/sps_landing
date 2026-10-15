/* V4 "다섯 개의 점" 장면: SPS 심볼(십자형 다섯 점)이 흩어진 점에서 모이고, 각 점이 창이 되어 사진을 드러낸다.
   스크롤 진행도 하나로만 움직이며 회전·색 반전·고정 텍스트 이어받기는 쓰지 않는다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root) root.SPSSymbolScene = api.start(root);
})(typeof window === 'undefined' ? null : window, function () {
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
  const range = (p, a, b) => smooth((p - a) / (b - a));
  // 심볼 좌표: assets/logo.svg 의 다섯 원(중심 간격 8.55, 반지름 3.19)을 단위 1로 정규화.
  const UNIT = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
  // 궤도 비행: 각 점은 화면 바깥의 먼 궤도에서 출발해 중심을 감아 돌며 반지름을 줄이고, 심볼의 제자리 궤도에 안착한다.
  // sweep = 감아 도는 각도(라디안, 음수는 반대 방향), far = 출발 반지름(뷰포트 긴 변 비율), delay = 출발 시차.
  const ORBIT = [
    { sweep: 2.4, far: 0.95, delay: 0.1 },    // 가운데: 가장 길게 감아 돌아 중심으로 떨어진다
    { sweep: -1.9, far: 0.85, delay: 0 },     // 왼쪽
    { sweep: 1.7, far: 0.9, delay: 0.14 },    // 오른쪽
    { sweep: -2.2, far: 0.8, delay: 0.05 },   // 위
    { sweep: 1.5, far: 0.88, delay: 0.19 },   // 아래
  ];
  const TRAIL_SAMPLES = 18;
  // 각 점이 먼 궤도에서 중심을 감아 돌며 반지름을 줄이고, 심볼의 제자리에 바로 안착한다.
  function orbitPoint(i, t, w, h, spacing) {
    const u = UNIT[i], o = ORBIT[i];
    const cx0 = w / 2, cy0 = h / 2;
    const endR = Math.hypot(u[0], u[1]) * spacing;                 // 심볼에서의 반지름(가운데는 0)
    const endA = Math.atan2(u[1], u[0] || (u[1] ? 0 : 1));          // 심볼에서의 각도
    const far = Math.max(w, h) * o.far;
    const k = 1 - t;
    const r = endR + (far - endR) * k * k * k;                      // 바깥에서 빠르게, 안쪽에서 천천히 좁아지는 나선
    const a = endA + o.sweep * k * k;                               // 안착 직전에 각속도가 잦아든다
    const tilt = 0.62 + 0.38 * (1 - k * k);                         // 멀리서는 납작한 궤도면, 도착하며 정면
    return [cx0 + r * Math.cos(a), cy0 + r * Math.sin(a) * tilt];
  }
  function frame(p, w, h) {
    const open = range(p, 0.5, 0.64);          // 심볼이 창이 되어 사진 등장
    const fill = range(p, 0.62, 0.92);         // 원이 자라 화면을 채움
    const spacing = Math.min(w, h) * 0.11;     // 심볼 점 간격
    const dot = Math.min(w, h) * 0.041;        // 심볼 점 반지름
    const cover = Math.hypot(w, h);            // 화면을 덮는 지름
    return UNIT.map((u, i) => {
      const o = ORBIT[i];
      const raw = clamp01((p - o.delay) / 0.3);  // 점마다 시차를 두고 0~0.49 사이에 안착
      const t = 1 - Math.pow(1 - raw, 2.6);      // 먼 궤도에서는 빠르게, 안착은 부드럽게
      const [cx, cy] = orbitPoint(i, t, w, h, spacing);
      const arrive = 0.55 + 0.45 * t;            // 멀리서 작게, 도착하며 제 크기로
      const grow = range(fill, i === 0 ? 0 : 0.12, 1); // 가운데 원이 먼저 자란다
      const size = dot * arrive * (1 - open * 0.1) + (cover / 2) * grow;
      // 궤적: 지나온 구간 일부를 점 뒤에 남긴다 (안착하면 사라짐).
      const trail = [];
      const trailing = t > 0.01 && t < 0.995;
      if (trailing) {
        const back = Math.max(0, t - 0.22);
        for (let s = 0; s <= TRAIL_SAMPLES; s++) trail.push(orbitPoint(i, back + (t - back) * s / TRAIL_SAMPLES, w, h, spacing));
      }
      // 원형 유지: 모서리 반지름을 항상 크기와 같게 둔다.
      return { x: cx - size, y: cy - size, w: size * 2, h: size * 2, rx: size, opacity: 1, trail, trailOpacity: trailing ? 0.45 * (1 - t * t) : 0 };
    });
  }
  function start(win) {
    const doc = win.document;
    const section = doc.querySelector('.hw-symbol');
    if (!section) return null;
    const stage = section.querySelector('.hw-symbol-stage');
    const svg = section.querySelector('.hw-symbol-svg');
    const shapes = [...svg.querySelectorAll('mask rect')];
    const trails = [...svg.querySelectorAll('.hw-symbol-trail')];
    const image = svg.querySelector('image');
    const red = svg.querySelector('.hw-symbol-red');
    const copy = section.querySelector('.hw-symbol-copy');
    const kicker = section.querySelector('.hw-symbol-kicker');
    const reduce = win.matchMedia('(prefers-reduced-motion: reduce)');
    let pending = 0, metrics = null;
    function measure() {
      const rect = stage.getBoundingClientRect();
      const w = stage.clientWidth || rect.width, h = stage.clientHeight || rect.height;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      image.setAttribute('width', w); image.setAttribute('height', h);
      red.setAttribute('width', w); red.setAttribute('height', h);
      const top = section.getBoundingClientRect().top + win.scrollY;
      const travel = Math.max(1, section.offsetHeight - stage.offsetHeight);
      metrics = { w, h, start: top, end: top + travel };
    }
    function paint(force) {
      pending = 0;
      if (!metrics) measure();
      const p = reduce.matches ? 1 : clamp01((win.scrollY - metrics.start) / (metrics.end - metrics.start));
      const states = frame(p, metrics.w, metrics.h);
      states.forEach((s, i) => {
        const el = shapes[i];
        el.setAttribute('x', s.x.toFixed(1)); el.setAttribute('y', s.y.toFixed(1));
        el.setAttribute('width', s.w.toFixed(1)); el.setAttribute('height', s.h.toFixed(1));
        el.setAttribute('rx', s.rx.toFixed(1));
        const trail = trails[i];
        if (trail) {
          trail.setAttribute('points', s.trail.map(pt => pt[0].toFixed(1) + ',' + pt[1].toFixed(1)).join(' '));
          trail.style.opacity = s.trailOpacity.toFixed(3);
        }
      });
      const open = range(p, 0.5, 0.64);
      image.style.opacity = open.toFixed(3);
      red.style.opacity = (1 - open).toFixed(3);
      const text = range(p, 0.78, 0.95);
      copy.style.opacity = text.toFixed(3);
      copy.style.transform = 'translateY(' + ((1 - text) * 24).toFixed(1) + 'px)';
      kicker.style.opacity = (1 - range(p, 0.4, 0.54)).toFixed(3);
      section.dataset.phase = p < 0.5 ? 'gather' : p < 0.92 ? 'open' : 'full';
    }
    function schedule(again) { if (again) metrics = null; if (!pending) pending = win.requestAnimationFrame(() => paint()); }
    win.addEventListener('scroll', () => schedule(false), { passive: true });
    win.addEventListener('resize', () => schedule(true), { passive: true });
    win.addEventListener('sps-theme-change', () => schedule(true));
    reduce.addEventListener('change', () => schedule(true));
    if ('ResizeObserver' in win) new win.ResizeObserver(() => schedule(true)).observe(stage);
    doc.fonts?.ready.then(() => schedule(true));
    measure(); paint();
    return { paint: () => { metrics = null; paint(); }, frame };
  }
  return { start, frame };
});
